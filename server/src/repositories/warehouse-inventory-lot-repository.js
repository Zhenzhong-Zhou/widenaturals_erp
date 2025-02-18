const {
  query,
  withTransaction,
  lockRow,
  bulkInsert,
} = require('../database/db');
const {
  insertWarehouseLotAdjustment,
} = require('./warehouse-lot-adjustment-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const {
  insertInventoryActivityLog,
} = require('./inventory-activity-log-repository');
const { getActionTypeId } = require('./inventory-action-type-repository');
const { getInventoryIdByProductId } = require('./inventory-repository');
const {
  insertInventoryHistoryLog,
  generateChecksum,
} = require('./inventory-history-repository');
const { getWarehouseLotStatus } = require('./warehouse-lot-status-repository');
const { getStatusIdByName } = require('./status-repository');

/**
 * Checks if a lot exists in the warehouse inventory and locks it for update.
 * @param {string} warehouse_inventory_id - The ID of the warehouse inventory lot.
 * @param {boolean} lockForUpdate - Whether to apply FOR UPDATE locking (default: false)
 * @param client
 * @returns {Promise<Object>} - Lot details including quantity, status_id, manufacture_date, expiry_date
 * @throws {Error} If the lot is not found
 */
const checkLotExists = async (
  warehouse_inventory_id,
  lockForUpdate = false,
  client
) => {
  try {
    if (lockForUpdate) {
      // Use lockRow for safe row locking
      return await lockRow(
        client,
        'warehouse_inventory_lots',
        warehouse_inventory_id,
        'FOR UPDATE'
      );
    }

    // Fetch without locking
    const text = `
      SELECT id, warehouse_id, product_id, lot_number, quantity, status_id, manufacture_date, expiry_date
      FROM warehouse_inventory_lots
      WHERE id = $1
    `;
    const { rows } = await query(text, [warehouse_inventory_id], client);

    if (!rows.length)
      throw new AppError(`Lot with ID ${warehouse_inventory_id} not found.`);

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
      const {
        warehouse_inventory_id,
        adjustment_type_id,
        adjusted_quantity,
        comments,
        order_id,
      } = record;

      // Lock the existing lot and get details
      const existingLot = await checkLotExists(
        warehouse_inventory_id,
        true,
        client
      );
      const {
        warehouse_id,
        inventory_id,
        lot_number,
        quantity: previous_quantity,
        status_id,
      } = existingLot;
      const statusName = await getWarehouseLotStatus(client, { id: status_id });

      const new_quantity = previous_quantity + adjusted_quantity;
      if (new_quantity < 0) {
        throw new AppError(
          `Stock adjustment for lot ${lot_number} would result in negative stock.`
        );
      }

      // Fetch warehouse inventory reserved and available quantities
      const { rows: warehouseInventoryRows } = await client.query(
        `
        SELECT reserved_quantity, available_quantity
        FROM warehouse_inventory
        WHERE warehouse_id = $1 AND inventory_id = $2 FOR UPDATE`,
        [warehouse_id, inventory_id]
      );

      if (!warehouseInventoryRows.length) {
        throw new AppError(
          `Warehouse inventory record not found for warehouse ${warehouse_id} and inventory ${inventory_id}`
        );
      }

      let { available_quantity } = warehouseInventoryRows[0];

      // Prevent over-adjustment: available_quantity should NEVER go below 0
      let updated_available_quantity = available_quantity + adjusted_quantity;
      if (updated_available_quantity < 0) {
        throw new AppError(
          `Adjustment not allowed: Available stock cannot be negative. Current available: ${available_quantity}, Adjustment: ${adjusted_quantity}`
        );
      }

      // Update warehouse inventory quantities (reserved_quantity remains unchanged)
      await client.query(
        `
        UPDATE warehouse_inventory
        SET available_quantity = GREATEST(0, $1),
            updated_at = NOW(),
            updated_by = $2
        WHERE warehouse_id = $3 AND inventory_id = $4`,
        [updated_available_quantity, user_id, warehouse_id, inventory_id]
      );

      // Restrict Adjustments Based on Lot Status
      if (
        ['shipped', 'expired', 'sold_out'].includes(statusName) ||
        (statusName === 'out_of_stock' && adjusted_quantity < 0)
      ) {
        throw new AppError(`Cannot adjust quantity for ${statusName} lots.`);
      }

      // Determine New Status for Warehouse Lot
      let new_status_id = status_id;
      if (new_quantity === 0) {
        const { id } = await getWarehouseLotStatus(client, {
          name: 'out_of_stock',
        });
        new_status_id = id;
      } else if (new_quantity > 0 && statusName !== 'in_stock') {
        const { id } = await getWarehouseLotStatus(client, {
          name: 'in_stock',
        });
        new_status_id = id;
      }

      // Update Warehouse Inventory Lot
      await client.query(
        `
        UPDATE warehouse_inventory_lots
        SET quantity = $1, status_id = $2, updated_at = NOW(), updated_by = $3
        WHERE id = $4`,
        [new_quantity, new_status_id, user_id, warehouse_inventory_id]
      );

      // Determine Warehouse Inventory Status Based on Lot Availability
      const { rows: warehouseStatusRows } = await client.query(
        `
        SELECT COALESCE(SUM(wil.quantity), 0) AS total_lot_quantity,
               COALESCE(SUM(wi.reserved_quantity), 0) AS total_reserved
        FROM warehouse_inventory wi
        LEFT JOIN warehouse_inventory_lots wil
          ON wi.warehouse_id = wil.warehouse_id
          AND wi.inventory_id = wil.inventory_id
        WHERE wi.inventory_id = $1
        GROUP BY wi.inventory_id`,
        [inventory_id]
      );

      let warehouse_total_stock =
        warehouseStatusRows[0]?.total_lot_quantity || 0;
      let warehouse_total_reserved =
        warehouseStatusRows[0]?.total_reserved || 0;

      let warehouse_new_status =
        warehouse_total_stock === 0 && warehouse_total_reserved === 0
          ? await getWarehouseLotStatus(client, { name: 'out_of_stock' })
          : await getWarehouseLotStatus(client, { name: 'in_stock' });

      // Update Warehouse Inventory Status
      await client.query(
        `
        UPDATE warehouse_inventory
        SET status_id = $1, last_update = NOW(), updated_at = NOW(), updated_by = $2
        WHERE warehouse_id = $3 AND inventory_id = $4`,
        [warehouse_new_status.id, user_id, warehouse_id, inventory_id]
      );

      // Determine Global Inventory Status
      const { rows: inventoryStatusRows } = await client.query(
        `
        SELECT SUM(available_quantity) AS total_available, SUM(reserved_quantity) AS total_reserved
        FROM warehouse_inventory WHERE inventory_id = $1`,
        [inventory_id]
      );

      let inventory_total_available =
        inventoryStatusRows[0]?.total_available || 0;
      let inventory_total_reserved =
        inventoryStatusRows[0]?.total_reserved || 0;

      let inventory_new_status =
        inventory_total_available === 0 && inventory_total_reserved === 0
          ? await getWarehouseLotStatus(client, { name: 'out_of_stock' })
          : await getWarehouseLotStatus(client, { name: 'in_stock' });

      // Update Inventory Status
      await client.query(
        `
        UPDATE inventory
        SET status_id = $1, last_update = NOW(), updated_at = NOW(), updated_by = $2
        WHERE id = $3`,
        [inventory_new_status.id, user_id, inventory_id]
      );

      // Log Adjustments
      adjustedRecords.push({
        warehouse_inventory_id,
        warehouse_id,
        inventory_id,
        lot_number,
        new_quantity,
      });

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

    // Bulk Inserts
    if (warehouseLotAdjustments.length > 0) {
      await bulkInsert(
        'warehouse_lot_adjustments',
        [
          'warehouse_id',
          'inventory_id',
          'lot_number',
          'adjustment_type_id',
          'previous_quantity',
          'adjusted_quantity',
          'new_quantity',
          'status_id',
          'adjusted_by',
          'comments',
          'updated_by',
        ],
        warehouseLotAdjustments,
        client
      );
    }

    if (inventoryActivityLogs.length > 0) {
      await bulkInsert(
        'inventory_activity_log',
        [
          'inventory_id',
          'warehouse_id',
          'lot_id',
          'inventory_action_type_id',
          'previous_quantity',
          'quantity_change',
          'new_quantity',
          'status_id',
          'adjustment_type_id',
          'order_id',
          'user_id',
          'comments',
        ],
        inventoryActivityLogs,
        client
      );
    }

    if (inventoryHistoryLogs.length > 0) {
      await bulkInsert(
        'inventory_history',
        [
          'inventory_id',
          'inventory_action_type_id',
          'previous_quantity',
          'quantity_change',
          'new_quantity',
          'status_id',
          'status_date',
          'source_action_id',
          'comments',
          'checksum',
          'metadata',
          'created_at',
          'created_by',
        ],
        inventoryHistoryLogs,
        client
      );
    }

    return adjustedRecords;
  });
};

const insertWarehouseInventoryLots = async (trx, warehouseLots) => {
  if (!warehouseLots.length) return [];
  
  const columns = [
    "warehouse_id", "inventory_id", "lot_number", "quantity",
    "expiry_date", "manufacture_date", "outbound_date", "status_id", "created_by",
    "updated_at", "updated_by"
  ];
  
  const rows = warehouseLots.map(({ warehouse_id, inventory_id, lot_number, quantity, expiry_date, manufacture_date, status_id, created_by }) => [
    warehouse_id, inventory_id, lot_number, quantity, expiry_date, manufacture_date, null, status_id, created_by,
    null, null
  ]);
  return await bulkInsert(
    "warehouse_inventory_lots",
    columns,
    rows,
    ["warehouse_id", "inventory_id", "lot_number"], // Conflict handling
    [] // DO NOTHING on conflict
  );
};

module.exports = {
  adjustWarehouseInventoryLots,
  insertWarehouseInventoryLots,
};
