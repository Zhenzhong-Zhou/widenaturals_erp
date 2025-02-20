const {
  query,
  withTransaction,
  lockRow,
  bulkInsert, retry,
} = require('../database/db');
const {
  insertWarehouseLotAdjustment,
} = require('./warehouse-lot-adjustment-repository');
const AppError = require('../utils/AppError');
const { logError, logWarn, logInfo } = require('../utils/logger-helper');
const {
  insertInventoryActivityLog, bulkInsertInventoryActivityLogs,
} = require('./inventory-activity-log-repository');
const { getActionTypeId } = require('./inventory-action-type-repository');
const {
  insertInventoryHistoryLog, bulkInsertInventoryHistory,
} = require('./inventory-history-repository');
const { getWarehouseLotStatus } = require('./warehouse-lot-status-repository');
const { getStatusIdByName } = require('./status-repository');
const { generateChecksum } = require('../utils/crypto-utils');
const { getWarehouseLotAdjustmentType, bulkInsertWarehouseLotAdjustments } = require('./lot-adjustment-type-repository');

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
      
      const adjustmentType = await getWarehouseLotAdjustmentType(client, { id: adjustment_type_id });
      
      // Ensure the adjustment type exists and check the type name
      if (!adjustmentType) {
        logWarn(`Skipping adjustment: Type ID ${adjustment_type_id} not found.`);
        continue; // Skip this entry if the adjustment type is not valid
      }
      
      // Define valid adjustment types that should be recorded
      const validAdjustmentTypes = [
        "damaged", "lost", "defective", "expired", "stolen",
        "recalled", "adjustment", "reclassified", "conversion"
      ];
      
      // Check if adjustment type requires logging
      if (validAdjustmentTypes.includes(adjustmentType.name.toLowerCase())) {
        warehouseLotAdjustments.push({
          warehouse_id,
          inventory_id,
          lot_number,
          adjustment_type_id,
          previous_quantity,
          adjusted_quantity,
          new_quantity,
          status_id: new_status_id,
          adjusted_by: user_id,
          adjustment_date: new Date(),
          comments: comments || null,
          created_by: user_id,
          updated_by: user_id,
        });
      } else {
        logInfo(`Skipping adjustment: Type "${adjustmentType.name}" does not require logging.`);
      }
      
      inventoryActivityLogs.push({
        inventory_id,
        warehouse_id,
        lot_id: null,
        inventory_action_type_id: actionTypeId,
        previous_quantity: previous_quantity ?? 0,
        quantity_change: adjusted_quantity ?? 0,
        new_quantity: new_quantity ?? 0,
        status_id: new_status_id,
        adjustment_type_id: adjustment_type_id || null,
        order_id: order_id || null,
        user_id,
        timestamp: new Date(), // Automatically add timestamp
        comments: comments || null,
      });
      
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
      
      inventoryHistoryLogs.push({
        inventory_id,
        inventory_action_type_id: actionTypeId,
        previous_quantity: previous_quantity ?? 0,
        quantity_change: adjusted_quantity ?? 0,
        new_quantity: new_quantity ?? 0,
        status_id: new_status_id,
        status_date: new Date(), // Automatically set timestamp
        source_action_id: user_id,
        comments: comments || null,
        checksum: checksum || null,
        metadata: {}, // Empty object instead of '{}'
        created_at: new Date(),
        created_by: user_id,
      });
    }
    
    // Bulk Inserts
    if (warehouseLotAdjustments.length > 0) {
      await bulkInsertWarehouseLotAdjustments(warehouseLotAdjustments, client)
    }

    if (inventoryActivityLogs.length > 0) {
      await bulkInsertInventoryActivityLogs(inventoryActivityLogs, client);
    }
    
    if (inventoryHistoryLogs.length > 0) {
      await bulkInsertInventoryHistory(inventoryHistoryLogs, client);
    }
    
    return adjustedRecords;
  });
};

/**
 * Inserts warehouse inventory lot records in bulk with conflict handling and retry mechanism.
 *
 *  @param {import("pg").PoolClient} client - The PostgreSQL client instance (transaction).
 * @param {Array<Object>} warehouseLots - The list of warehouse lot entries to insert.
 * @param {string} warehouseLots[].warehouse_id - The ID of the warehouse.
 * @param {string} warehouseLots[].inventory_id - The ID of the inventory item.
 * @param {string} warehouseLots[].lot_number - The lot number for tracking.
 * @param {number} warehouseLots[].quantity - The quantity associated with the lot.
 * @param {Date|null} [warehouseLots[].expiry_date] - The expiration date of the lot (nullable).
 * @param {Date|null} [warehouseLots[].manufacture_date] - The manufacturing date of the lot (nullable).
 * @param {string} warehouseLots[].status_id - The status ID of the lot.
 * @param {string} warehouseLots[].created_by - The user ID of the creator.
 *
 * @returns {Promise<Array<Object>>} - Resolves with the inserted warehouse inventory lot records.
 * @throws {Error} - Throws an error if the bulk insert fails after retries.
 */
const insertWarehouseInventoryLots = async (client, warehouseLots) => {
  if (!Array.isArray(warehouseLots) || warehouseLots.length === 0) {
    return [];
  }
  
  try {
    const columns = [
      "warehouse_id", "inventory_id", "lot_number", "quantity",
      "expiry_date", "manufacture_date", "outbound_date", "status_id", "created_by",
      "updated_at", "updated_by"
    ];
    
    const rows = warehouseLots.map(({ warehouse_id, inventory_id, lot_number, quantity, expiry_date, manufacture_date, status_id, created_by }) => [
      warehouse_id, inventory_id, lot_number, quantity, expiry_date, manufacture_date, null, status_id, created_by,
      null, null
    ]);
    
    // Step 1: Bulk Insert with Retry and Conflict Handling
    return await retry(
      () =>
        bulkInsert(
          "warehouse_inventory_lots",
          columns,
          rows,
          ["warehouse_id", "inventory_id", "lot_number"], // Conflict columns
          [], // DO NOTHING on conflict
          client
        ),
      3, // Retries up to 3 times
      1000 // Initial delay of 1s, with exponential backoff
    );
  } catch (error) {
    logError("Error inserting warehouse inventory lots:", error);
    throw new AppError.databaseError("Failed to insert warehouse inventory lots.", {
      details: { error: error.message, warehouseLots },
    });
  }
};

module.exports = {
  adjustWarehouseInventoryLots,
  insertWarehouseInventoryLots,
};
