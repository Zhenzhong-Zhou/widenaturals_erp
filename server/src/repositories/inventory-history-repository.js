const crypto = require('crypto');
const { query, bulkInsert, retry } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Inserts a record into the inventory history log.
 * @param {Object} client - The database client (optional, for transactions).
 * @param {string} inventory_id - The inventory record ID.
 * @param {string} inventory_action_type_id - The action type ID (e.g., 'manual_adjustment', 'restock').
 * @param {number} previous_quantity - The previous quantity before adjustment.
 * @param {number} quantity_change - The change in quantity (+ or -).
 * @param {number} new_quantity - The new quantity after adjustment.
 * @param {string} user_id - The user who performed the action.
 * @param {string|null} comments - Optional comments for the adjustment.
 * @returns {Promise<Object>} - The inserted inventory history record.
 */
const insertInventoryHistoryLog = async (
  client,
  inventory_id,
  inventory_action_type_id,
  previous_quantity,
  quantity_change,
  new_quantity,
  user_id,
  comments = null
) => {
  const checksum = generateChecksum(
    inventory_id,
    inventory_action_type_id,
    previous_quantity,
    quantity_change,
    new_quantity,
    user_id,
    comments
  );

  const queryText = `
    INSERT INTO inventory_history (
      inventory_id, inventory_action_type_id, previous_quantity, quantity_change,
      new_quantity, status_id, status_date, source_action_id, comments, checksum, metadata,
      created_at, created_by
    )
    VALUES (
      $1, $2, $3, $4, $5,
      (SELECT id FROM status WHERE name = 'active' LIMIT 1),
      NOW(), $6, $7, $8, '{}'::jsonb, NOW(), $6
    )
    RETURNING *;
  `;

  const values = [
    inventory_id, // $1
    inventory_action_type_id, // $2
    previous_quantity, // $3
    quantity_change, // $4
    new_quantity, // $5
    user_id, // $6  -> Created By & Source Action ID
    comments || null, // $7  -> Optional comments (ensure nullable)
    checksum,
  ];

  try {
    const { rows } = await query(queryText, values, client);
    return rows[0];
  } catch (error) {
    logError('Error inserting inventory history log:', error);
    throw new AppError(
      'Database error: Failed to insert inventory history log.'
    );
  }
};

/**
 * Inserts multiple inventory history records into the database using bulk insert.
 *
 * @param {Array<Object>} historyRecords - List of inventory history records to be inserted.
 * @param {string} historyRecords[].inventory_id - The UUID of the inventory item.
 * @param {string} historyRecords[].inventory_action_type_id - The UUID of the action type associated with this history entry.
 * @param {number} historyRecords[].previous_quantity - The inventory quantity before the update.
 * @param {number} historyRecords[].quantity_change - The change in inventory quantity.
 * @param {number} historyRecords[].new_quantity - The updated inventory quantity after the change.
 * @param {string|null} historyRecords[].status_id - The optional status ID (e.g., active, archived).
 * @param {string} historyRecords[].source_action_id - The UUID of the user or system process that triggered this history entry.
 * @param {string|null} historyRecords[].comments - A brief comment or description of the change.
 * @param {string} historyRecords[].checksum - A unique hash to ensure data integrity.
 * @param {Object} historyRecords[].metadata - Additional metadata stored as JSON.
 * @param {string} historyRecords[].created_by - The UUID of the user who created this history record.
 * @param {Object} client - The database transaction client.
 * @returns {Promise<Array<Object>>} - Resolves with an array of inserted inventory history records.
 * @throws {AppError} - Throws an AppError if validation or database insertion fails.
 */
const bulkInsertInventoryHistory = async (historyRecords, client) => {
  if (!Array.isArray(historyRecords) || historyRecords.length === 0) {
    throw new AppError.validationError(
      'No inventory history records provided for bulk insert.'
    );
  }

  const tableName = 'inventory_history';
  const columns = [
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
  ];

  // Convert records into a nested array of values
  const rows = historyRecords.map((record) => [
    record.inventory_id,
    record.inventory_action_type_id,
    record.previous_quantity,
    record.quantity_change,
    record.new_quantity,
    record.status_id || null, // Allow null if status_id is not provided
    new Date(), // status_date (use current timestamp)
    record.source_action_id,
    record.comments || null,
    record.checksum || null,
    record.metadata || {}, // Default to empty JSON
    new Date(), // created_at (use current timestamp)
    record.created_by,
  ]);

  try {
    return await retry(
      () => bulkInsert(tableName, columns, rows, [], [], client),
      3, // Retry up to 3 times
      1000 // Initial delay of 1 second (exponential backoff applied)
    );
  } catch (error) {
    logError('Error inserting bulk inventory history:', error.message);
    throw error;
  }
};

module.exports = {
  insertInventoryHistoryLog,
  bulkInsertInventoryHistory,
};
