const { query, paginateQuery, retry, bulkInsert } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

/**
 * Fetch all warehouse lot adjustment types.
 * @returns {Promise<Array<{ id: string, name: string }>>} - Adjustment type list.
 */
const getWarehouseLotAdjustmentTypes = async () => {
  const queryText = `
    SELECT id, name
    FROM lot_adjustment_types
    WHERE is_active = true
    ORDER BY name ASC;
  `;

  try {
    const { rows } = await query(queryText);
    return rows;
  } catch (error) {
    logError('Error fetching warehouse lot adjustment types:', error);
    throw new AppError(
      'Database error: Failed to fetch warehouse lot adjustment types.'
    );
  }
};

/**
 * Fetch all active warehouse lot adjustment types.
 * Filters out: expired, sold out, out of stock, and inactive types.
 * @returns {Promise<Array<{ id: string, name: string, description: string }>>} - Active adjustment type list.
 */
const getActiveLotAdjustmentTypes = async () => {
  const queryText = `
    SELECT id, name, description
    FROM lot_adjustment_types
    WHERE is_active = TRUE
      AND name NOT IN ('shipped', 'expired', 'sold_out', 'out_of_stock')
    ORDER BY name ASC;
  `;

  try {
    const { rows } = await query(queryText);
    return rows;
  } catch (error) {
    logError('Error fetching active warehouse lot adjustment types:', error);
    throw new AppError(
      'Database error: Failed to fetch active warehouse lot adjustment types.'
    );
  }
};

/**
 * Fetches a warehouse lot adjustment type by ID or name.
 *
 * @param {import('pg').PoolClient} client - The database client or transaction instance.
 * @param {Object} params - The search parameters.
 * @param {string} [params.id] - The ID of the adjustment type (optional).
 * @param {string} [params.name] - The name of the adjustment type (optional).
 * @returns {Promise<{ id: string, name: string } | null>} - Returns the adjustment type details if found, otherwise null.
 * @throws {AppError} - Throws an error if neither ID nor name is provided or if a database error occurs.
 */
const getWarehouseLotAdjustmentType = async (client, { id, name }) => {
  if (!id && !name) {
    throw new AppError("At least one parameter (id or name) must be provided.");
  }
  
  const queryText = `
    SELECT id, name
    FROM lot_adjustment_types
    WHERE
      ($1::UUID IS NULL OR id = $1)
      AND ($2::TEXT IS NULL OR name = $2)
    LIMIT 1;
  `;
  
  return await retry(async () => {
    try {
      const { rows } = client ?
        await query(queryText, [id || null, name || null]) :
        await client.query(queryText, [id || null, name || null]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      logError(
        `Error fetching warehouse lot adjustment type with ${id ? "ID: " + id : ""} ${name ? "Name: " + name : ""}`,
        error
      );
      throw new AppError.databaseError(
        `Database error: Failed to fetch warehouse lot adjustment type with ${id ? "ID " + id : ""} ${name ? "Name " + name : ""}`
      );
    }
  }, 3, 1000); // Retry up to 3 times with exponential backoff
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
    "warehouse_id",
    "inventory_id",
    "lot_number",
    "adjustment_type_id",
    "previous_quantity",
    "adjusted_quantity",
    "new_quantity",
    "status_id",
    "adjusted_by",
    "adjustment_date",
    "comments",
    "created_at",
    "updated_at",
    "created_by",
    "updated_by",
  ];
  
  // Convert adjustments into a nested array of values for bulk insert
  const rows = adjustments.map(adj => [
    adj.warehouse_id,
    adj.inventory_id,
    adj.lot_number,
    adj.adjustment_type_id,
    adj.previous_quantity,
    adj.adjusted_quantity,
    adj.new_quantity,
    adj.status_id || null, // Allow null if status_id is not provided
    adj.adjusted_by,
    adj.adjustment_date || new Date(),
    adj.comments || null,
    new Date(), // created_at (use current timestamp)
    new Date(), // updated_at (use current timestamp)
    adj.created_by || adj.adjusted_by, // Use adjusted_by if created_by is not explicitly provided
    adj.updated_by || adj.adjusted_by, // Use adjusted_by if updated_by is not explicitly provided
  ]);
  
  try {
    // Step 1: Retry Bulk Insert (3 Attempts with Exponential Backoff)
    return await retry(
      () => bulkInsert(
        tableName,
        columns,
        rows,
        ["warehouse_id", "inventory_id", "lot_number", "adjustment_date"], // Unique conflict constraint
        ["new_quantity", "updated_at", "updated_by"], // Update these columns on conflict
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
  getWarehouseLotAdjustmentTypes,
  getWarehouseLotAdjustmentType,
  bulkInsertWarehouseLotAdjustments,
};
