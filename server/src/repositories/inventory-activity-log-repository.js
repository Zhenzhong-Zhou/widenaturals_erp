const { query, withTransaction, bulkInsert, retry } = require('../database/db');
const {
  insertWarehouseLotAdjustment,
} = require('./warehouse-lot-adjustment-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Inserts an inventory activity log entry
 */
const insertInventoryActivityLog = async (
  client,
  inventory_id,
  warehouse_id,
  lot_id,
  inventory_action_type_id,
  previous_quantity,
  adjusted_quantity,
  new_quantity,
  adjustment_type_id,
  order_id,
  user_id,
  comments
) => {
  const text = `
    INSERT INTO inventory_activity_log (
      inventory_id, warehouse_id, lot_id, inventory_action_type_id,
      previous_quantity, quantity_change, new_quantity, adjustment_type_id,
      order_id, user_id, timestamp, comments
    )
    VALUES (
     $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11
    )
    RETURNING *;
  `;

  const values = [
    inventory_id,
    warehouse_id,
    lot_id,
    inventory_action_type_id,
    previous_quantity,
    adjusted_quantity,
    new_quantity,
    adjustment_type_id,
    order_id || null,
    user_id,
    comments,
  ];

  try {
    const { rows } = await query(text, values, client);
    return rows[0]; // Return inserted record
  } catch (error) {
    logError('Error inserting inventory activity log:', error.message);
    throw error;
  }
};

/**
 * Inserts multiple inventory activity log records into the database using bulk insert.
 *
 * @param {Array<Object>} logs - List of inventory activity log entries to be inserted.
 * @param {string} logs[].inventory_id - The UUID of the inventory item.
 * @param {string} logs[].warehouse_id - The UUID of the warehouse where the activity occurred.
 * @param {string|null} logs[].lot_id - The optional UUID of the lot, if applicable.
 * @param {string} logs[].inventory_action_type_id - The UUID of the inventory action type (e.g., manual update).
 * @param {number} logs[].previous_quantity - The inventory quantity before the change.
 * @param {number} logs[].quantity_change - The change in inventory quantity.
 * @param {number} logs[].new_quantity - The updated inventory quantity after the change.
 * @param {string|null} logs[].status_id - The status ID of the inventory (e.g., in_stock, damaged).
 * @param {string|null} logs[].adjustment_type_id - The optional adjustment type ID.
 * @param {string|null} logs[].order_id - The optional UUID of the order related to this activity.
 * @param {string} logs[].user_id - The UUID of the user who performed the action.
 * @param {string} logs[].comments - A brief comment or description of the activity.
 * @param {Object} client - The database transaction client.
 * @returns {Promise<Array<Object>>} - Resolves with an array of inserted activity log records.
 * @throws {Error} - Throws an error if bulk insert fails.
 */
const bulkInsertInventoryActivityLogs = async (logs, client) => {
  if (!Array.isArray(logs) || logs.length === 0) {
    throw new AppError.validationError('No logs provided for bulk insert.');
  }

  const tableName = 'inventory_activity_log';
  const columns = [
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
    'timestamp',
    'comments',
  ];

  // Convert logs into a nested array of values for bulk insert
  const rows = logs.map((log) => [
    log.inventory_id,
    log.warehouse_id,
    log.lot_id || null,
    log.inventory_action_type_id,
    log.previous_quantity ?? 0, // Ensure previous quantity is always defined
    log.quantity_change ?? 0,
    log.new_quantity ?? 0,
    log.status_id || null,
    log.adjustment_type_id || null,
    log.order_id || null,
    log.user_id,
    new Date(), // Use current timestamp
    log.comments || null,
  ]);

  try {
    // Step 1: Retry Bulk Insert with Exponential Backoff
    return await retry(
      async () => {
        return await bulkInsert(
          tableName,
          columns,
          rows,
          [], // No conflict columns
          [], // No update columns (DO NOTHING on conflict)
          client
        );
      },
      3, // Retry up to 3 times
      1000 // Initial delay of 1 second (will exponentially back off)
    );
  } catch (error) {
    logError('Failed to insert bulk inventory activity logs:', error);
    throw new AppError.databaseError(
      'Bulk insert failed for inventory activity logs.',
      {
        details: { error: error.message, logs },
      }
    );
  }
};

module.exports = {
  insertInventoryActivityLog,
  bulkInsertInventoryActivityLogs,
};
