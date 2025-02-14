const { query, withTransaction, lockRow, bulkInsert } = require('../database/db');
const { insertWarehouseLotAdjustment } = require('./warehouse-lot-adjustment-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { insertInventoryActivityLog } = require('./inventory-activity-log-repository');
const { getActionTypeId } = require('./inventory-action-type-repository');
const { getInventoryIdByProductId } = require('./inventory-repository');
const { insertInventoryHistoryLog, generateChecksum } = require('./inventory-history-repository');
const { getWarehouseLotStatusId } = require('./warehouse-lot-status-repository');
const { getStatusIdByName } = require('./status-repository');

/**
 * Checks if a lot exists in the warehouse inventory and locks it for update.
 * @param {string} warehouse_inventory_id - The ID of the warehouse inventory lot.
 * @param {boolean} lockForUpdate - Whether to apply FOR UPDATE locking (default: false)
 * @param client
 * @returns {Promise<Object>} - Lot details including quantity, status_id, manufacture_date, expiry_date
 * @throws {Error} If the lot is not found
 */
const checkLotExists = async (warehouse_inventory_id, lockForUpdate = false, client) => {
  try {
    if (lockForUpdate) {
      // Use lockRow for safe row locking
      return await lockRow(client, 'warehouse_inventory_lots', warehouse_inventory_id, 'FOR UPDATE');
    }
    
    // Fetch without locking
    const text = `
      SELECT id, warehouse_id, product_id, lot_number, quantity, status_id, manufacture_date, expiry_date
      FROM warehouse_inventory_lots
      WHERE id = $1
    `;
    const { rows } = await query(text, [warehouse_inventory_id], client);
    
    if (!rows.length) throw new AppError(`Lot with ID ${warehouse_inventory_id} not found.`);
    
    return rows[0];
  } catch (error) {
    throw new AppError(`Error checking warehouse lot: ${error.message}`);
  }
};

/**
 * Adjusts warehouse inventory based on lot adjustments.
 * @param {Array} records - List of inventory adjustments.
 * @param {String} user_id - The user making the adjustment.
 * @returns {Promise<Array>} - List of adjusted records.
 */
const adjustWarehouseInventoryLots = async (records, user_id) => {
  return withTransaction(async (client) => {
    const adjustedRecords = [];
    
    // Prepare batch insert arrays
    const warehouseLotAdjustments = [];
    const inventoryActivityLogs = [];
    const inventoryHistoryLogs = [];
    
    for (const record of records) {
      const { warehouse_inventory_id, adjustment_type_id, adjusted_quantity, comments, order_id } = record;
      
      // Lock the existing lot and get details
      const existingLot = await checkLotExists(warehouse_inventory_id, true, client);
      
      const { warehouse_id, inventory_id, lot_number, quantity: previous_quantity, status_id } = existingLot;
      const new_quantity = previous_quantity + adjusted_quantity;
      
      if (new_quantity < 0) {
        throw new AppError(`Stock adjustment for lot ${lot_number} would result in negative stock.`);
      }
      
      // Ensure total stock constraints are not violated
      const warehouseInventory = await query(
        `SELECT total_quantity, reserved_quantity, available_quantity
         FROM warehouse_inventory WHERE warehouse_id = $1 AND inventory_id = $2 FOR UPDATE`,
        [warehouse_id, inventory_id],
        client
      );
      
      if (!warehouseInventory.rows.length) {
        throw new AppError(`Warehouse inventory record not found for warehouse ${warehouse_id} and inventory ${inventory_id}`);
      }
      
      let { total_quantity, available_quantity, reserved_quantity } = warehouseInventory.rows[0];
      
      // Update `warehouse_inventory` quantities
      const updated_total_quantity = total_quantity + adjusted_quantity;
      const updated_reserved_quantity = Math.min(reserved_quantity, updated_total_quantity);
      const updated_available_quantity = Math.max(0, updated_total_quantity - updated_reserved_quantity);
      
      if (updated_available_quantity < reserved_quantity) {
        throw new AppError(`Adjustment would cause available quantity to drop below reserved stock.`);
      }

      if (updated_available_quantity + reserved_quantity > updated_total_quantity) {
        throw new AppError(`Adjustment exceeds total inventory capacity.`);
      }
      
      // Prevent negative available stock
      if (updated_available_quantity < 0) {
        throw new AppError(`Available stock cannot be negative.`);
      }
      
      // Restrict based on status
      if (
        existingLot.status_name === 'shipped' ||
        existingLot.status_name === 'expired' ||
        (existingLot.status_name === 'out_of_stock' && adjusted_quantity < 0) ||
        existingLot.status_name === 'sold_out'
      ) {
        throw new Error(`Cannot adjust quantity for ${existingLot.status_name} lots.`);
      }
      
      // Determine new status
      let new_status_id = status_id;
      if (new_quantity === 0) {
        new_status_id = await getWarehouseLotStatusId(client, 'out_of_stock');
      } else if (new_quantity > 0 && existingLot.status_name !== 'in_stock') {
        new_status_id = await getWarehouseLotStatusId(client, 'in_stock');
      }
      
      await client.query(
        `UPDATE warehouse_inventory
         SET total_quantity = $1,
             reserved_quantity = $2,
             available_quantity = $3,
             last_update = NOW(),
             updated_by = $4
         WHERE warehouse_id = $5 AND inventory_id = $6`,
        [updated_total_quantity, updated_reserved_quantity, updated_available_quantity, user_id, warehouse_id, inventory_id]
      );
      
      // Update `inventory` table (aggregate total quantity across all warehouses)
      await client.query(
        `UPDATE inventory
         SET quantity = (
             SELECT COALESCE(SUM(total_quantity), 0)
             FROM warehouse_inventory
             WHERE inventory_id = $1
         ), last_update = NOW()
         WHERE id = $1`,
         [inventory_id]
      );
      
      // Update warehouse_inventory_lots quantity
      await client.query(
        `UPDATE warehouse_inventory_lots
         SET quantity = $1, status_id = $2, updated_at = NOW(), updated_by = $3
         WHERE id = $4`,
        [new_quantity, new_status_id, user_id, warehouse_inventory_id]
      );
      
      // Update warehouse_inventory available stock
      await client.query(`
        UPDATE warehouse_inventory
        SET total_quantity = available_quantity + reserved_quantity,
            last_update = NOW(), updated_by = $1
        WHERE warehouse_id = $2 AND inventory_id = $3`,
        [user_id, warehouse_id, inventory_id]
      );
      
      adjustedRecords.push({
        warehouse_inventory_id,
        warehouse_id,
        inventory_id,
        lot_number,
        new_quantity,
      });
      
      // Determine the correct action type (e.g., 'manual_adjustment', 'restock', 'sold')
      const actionType = 'manual_adjustment';
      const actionTypeId = await getActionTypeId(client, actionType);
      
      // Add to batch insert arrays
      warehouseLotAdjustments.push([
        warehouse_id,
        inventory_id,
        lot_number,
        adjustment_type_id,
        previous_quantity,
        adjusted_quantity,
        new_quantity,
        new_status_id,
        user_id,
        comments,
        user_id,
      ]);
      
      inventoryActivityLogs.push([
        inventory_id,
        warehouse_id,
        warehouse_inventory_id,
        actionTypeId,
        previous_quantity,
        adjusted_quantity,
        new_quantity,
        new_status_id,
        adjustment_type_id,
        order_id || null,
        user_id,
        comments,
      ]);
      
      const checksum = generateChecksum(
        inventory_id,
        actionTypeId,
        previous_quantity,
        adjusted_quantity,
        new_quantity,
        new_status_id,
        user_id,
        comments
      );
      
      // Push properly structured row
      inventoryHistoryLogs.push([
        inventory_id,
        actionTypeId,
        previous_quantity,
        adjusted_quantity,
        new_quantity,
        new_status_id,
        new Date().toISOString(),
        user_id,
        comments || null,
        checksum,
        '{}',
        new Date().toISOString(),
        user_id,
      ]);
    }
    
    // Perform bulk inserts
    if (warehouseLotAdjustments.length > 0) {
      await bulkInsert(
        'warehouse_lot_adjustments',
        [
          'warehouse_id', 'inventory_id', 'lot_number',
          'adjustment_type_id', 'previous_quantity',
          'adjusted_quantity', 'new_quantity', 'status_id',
          'adjusted_by', 'comments', 'updated_by'
        ],
        warehouseLotAdjustments,
        client
      );
    }
    
    if (inventoryActivityLogs.length > 0) {
      await bulkInsert(
        'inventory_activity_log',
        [
          'inventory_id', 'warehouse_id', 'lot_id',
          'inventory_action_type_id', 'previous_quantity',
          'quantity_change', 'new_quantity', 'status_id', 'adjustment_type_id',
          'order_id', 'user_id', 'comments'
        ],
        inventoryActivityLogs,
        client
      );
    }
    
    if (inventoryHistoryLogs.length > 0) {
      await bulkInsert(
        'inventory_history',
        [
          'inventory_id', 'inventory_action_type_id', 'previous_quantity',
          'quantity_change', 'new_quantity', 'status_id', 'status_date',
          'source_action_id', 'comments', 'checksum', 'metadata',
          'created_at', 'created_by'
        ],
        inventoryHistoryLogs,
        client
      );
    }
    
    return adjustedRecords;
  });
};

module.exports = {
  adjustWarehouseInventoryLots,
};
