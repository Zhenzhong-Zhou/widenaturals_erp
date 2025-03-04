const { query, retry, bulkInsert } = require('../database/db');
const { logError } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Inserts a warehouse lot adjustment record.
 * @param {Object} client - The database client (optional, for transactions).
 * @param {string} warehouse_inventory_lot_id - The ID of the warehouse-inventory-lot.
 * @param {string} adjustment_type_id - The type of adjustment (e.g., 'damaged', 'lost').
 * @param {number} previous_quantity - The previous quantity before adjustment.
 * @param {number} adjusted_quantity - The quantity change (+ or -).
 * @param {number} new_quantity - The new calculated quantity.
 * @param {string} adjusted_by - The user ID who made the adjustment.
 * @param {string} [status_id] - (Optional) The status of the lot after adjustment.
 * @param {string} [comments] - (Optional) Comments about the adjustment.
 * @returns {Promise<Object>} - The inserted adjustment record.
 */
const insertWarehouseLotAdjustment = async (
  client,
  warehouse_inventory_lot_id,
  adjustment_type_id,
  previous_quantity,
  adjusted_quantity,
  new_quantity,
  adjusted_by,
  status_id = null,
  comments = null
) => {
  const queryText = `
    INSERT INTO warehouse_lot_adjustments (
      warehouse_inventory_lot_id,
      adjustment_type_id,
      previous_quantity,
      adjusted_quantity,
      new_quantity,
      adjustment_date,
      adjusted_by,
      status_id,
      comments
    )
    VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8)
    RETURNING id;
  `;
  
  const values = [
    warehouse_inventory_lot_id,
    adjustment_type_id,
    previous_quantity,
    adjusted_quantity,
    new_quantity,
    adjusted_by,
    status_id,
    comments,
  ];
  
  try {
    // Use the query function instead of pool.query
    return await retry(
      async () => {
        const response = await query(queryText, values, client);
        return response.rows[0]; // Return the inserted row
      },
      3, // Retry attempts
      1000 // Delay in milliseconds between retries
    );
  } catch (error) {
    logError('Error inserting warehouse lot adjustment:', error);
    throw new AppError(
      'Database error: Failed to insert warehouse lot adjustment.'
    );
  }
};

/**
 * Bulk insert warehouse lot adjustments into the database.
 *
 * @param {Array<Object>} adjustments - Array of adjustment records to insert.
 * @param {Object} client - Database transaction client or connection pool.
 * @returns {Promise<Array>} - Inserted rows.
 * @throws {AppError} - Throws an error if insertion fails.
 */
const bulkInsertWarehouseLotAdjustments = async (adjustments, client) => {
  if (!Array.isArray(adjustments) || adjustments.length === 0) {
    throw new AppError.validationError("No warehouse lot adjustments provided for bulk insert.");
  }
  
  const tableName = "warehouse_lot_adjustments";
  const columns = [
    "warehouse_inventory_lot_id",
    "adjustment_type_id",
    "previous_quantity",
    "adjusted_quantity",
    "new_quantity",
    "status_id",
    "adjusted_by",
    "adjustment_date",
    "comments",
  ];
  
  // Convert adjustments into a nested array of values for bulk insert
  const rows = adjustments.map(adj => [
    adj.warehouse_inventory_id,
    adj.adjustment_type_id,
    adj.previous_quantity,
    adj.adjusted_quantity,
    adj.new_quantity,
    adj.status_id || null, // Allow null if status_id is not provided
    adj.adjusted_by,
    adj.adjustment_date || new Date(),
    adj.comments || null,
  ]);
  
  try {
    // Step 1: Retry Bulk Insert (3 Attempts with Exponential Backoff)
    return await retry(
      () => bulkInsert(
        tableName,
        columns,
        rows,
        ["warehouse_inventory_lot_id", "adjustment_date"], // Unique conflict constraint
        ["new_quantity"], // Update these columns on conflict
        client
      ),
      3, // Retry up to 3 times
      1000 // Initial delay of 1s, with exponential backoff
    );
  } catch (error) {
    logError("Error inserting warehouse lot adjustments:", error.message);
    throw new AppError.databaseError("Failed to insert warehouse lot adjustments.", {
      details: { error: error.message, adjustments },
    });
  }
};

module.exports = {
  insertWarehouseLotAdjustment,
  bulkInsertWarehouseLotAdjustments,
};
