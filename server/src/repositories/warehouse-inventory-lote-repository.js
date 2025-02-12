const { query, withTransaction, lockRow } = require('../database/db');
const { insertWarehouseLotAdjustment } = require('./warehouse-lot-adjustment-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { insertInventoryActivityLog } = require('./inventory-activity-log-repository');
const { getActionTypeId } = require('./inventory-action-type-repository');
const { getInventoryIdByProductId } = require('./inventory-repository');
const { insertInventoryHistoryLog } = require('./inventory-history-repository');
const { getWarehouseLotStatusId } = require('./warehouse-lot-status-repository');

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
    
    for (const record of records) {
      const { warehouse_inventory_id, adjustment_type_id, adjusted_quantity, comments, order_id } = record;
      
      // Lock the existing lot and get details
      const existingLot = await checkLotExists(warehouse_inventory_id, true, client);
      
      const { warehouse_id, product_id, lot_number, quantity: previous_quantity } = existingLot;
      const new_quantity = previous_quantity + adjusted_quantity;
      
      if (new_quantity < 0) {
        throw new AppError(`Stock adjustment for lot ${lot_number} would result in negative stock.`);
      }
      
      // Insert adjustment record
      await insertWarehouseLotAdjustment(
        client,
        warehouse_id,
        product_id,
        lot_number,
        adjustment_type_id,
        previous_quantity,
        adjusted_quantity,
        new_quantity,
        user_id
      );
      
      // Determine the correct action type (e.g., 'manual_adjustment', 'restock', 'sold')
      const actionType = 'manual_adjustment'; // Change this dynamically if needed
      const actionTypeId = await getActionTypeId(client, actionType);
      
      const inventory_id= await getInventoryIdByProductId(product_id);
      
      // Insert inventory activity log
      await insertInventoryActivityLog(
        client,
        inventory_id,
        warehouse_id,
        warehouse_inventory_id, // Using same ID for now
        actionTypeId, // Action Type ID for adjustment
        previous_quantity,
        adjusted_quantity,
        new_quantity,
        adjustment_type_id,
        order_id || null,
        user_id,
        comments
      );
      
      // Insert into `inventory_history_log` (for long-term tracking)
      await insertInventoryHistoryLog(
        client,
        inventory_id,
        actionTypeId,
        previous_quantity,
        adjusted_quantity,
        new_quantity,
        user_id,
        comments,
      );
      
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
      let new_status_id = existingLot.status_id; // Default: keep the same status
      
      if (new_quantity === 0) {
        new_status_id = await getWarehouseLotStatusId(client, 'out_of_stock'); // Set to 'out_of_stock'
      } else if (previous_quantity === 0 && new_quantity > 0) {
        new_status_id = await getWarehouseLotStatusId(client, 'in_stock'); // Set to 'in_stock'
      }
      
      // Update warehouse_inventory_lots quantity
      await client.query(`
        UPDATE warehouse_inventory_lots
        SET quantity = $1, status_id = $2, updated_at = NOW()
        WHERE id = $3
      `, [new_quantity, new_status_id, warehouse_inventory_id]
      );
      
      adjustedRecords.push({ warehouse_inventory_id, warehouse_id, product_id, lot_number, new_quantity });
    }
    
    return adjustedRecords;
  });
};

module.exports = {
  adjustWarehouseInventoryLots,
};
