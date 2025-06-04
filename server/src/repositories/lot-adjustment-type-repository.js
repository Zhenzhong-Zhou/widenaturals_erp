const { query, paginateQuery, retry, bulkInsert } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

/**
 * Fetch warehouse lot adjustment types for dropdown selection.
 * Excludes 'manual stock insert' and 'manual stock update'.
 * @returns {Promise<Array<{ id: string, name: string }>>} - Dropdown options.
 */
const getWarehouseLotAdjustmentTypesForDropdown = async () => {
  const queryText = `
    SELECT id, name
    FROM lot_adjustment_types
    WHERE is_active = true
    AND name NOT IN ('manual_stock_insert', 'manual_stock_update')
    ORDER BY name;
  `;

  try {
    const { rows } = await query(queryText);
    return rows;
  } catch (error) {
    logError('Error fetching lot adjustment types for dropdown:', error);
    throw AppError.databaseError(
      'Database error: Unable to retrieve lot adjustment types for dropdown.'
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
    throw AppError.databaseError(
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
    throw AppError.validationError(
      'At least one parameter (id or name) must be provided.'
    );
  }

  const queryText = `
    SELECT id, name
    FROM lot_adjustment_types
    WHERE
      ($1::UUID IS NULL OR id = $1)
      AND ($2::TEXT IS NULL OR name = $2)
    LIMIT 1;
  `;

  return await retry(
    async () => {
      try {
        const { rows } = await query(
          queryText,
          [id || null, name || null],
          client
        );
        return rows.length > 0 ? rows[0] : null;
      } catch (error) {
        logError(
          `Error fetching warehouse lot adjustment type with ${id ? 'ID: ' + id : ''} ${name ? 'Name: ' + name : ''}`,
          error
        );
        throw AppError.databaseError(
          `Database error: Failed to fetch warehouse lot adjustment type with ${id ? 'ID ' + id : ''} ${name ? 'Name ' + name : ''}`
        );
      }
    },
    3,
    1000
  ); // Retry up to 3 times with exponential backoff
};

module.exports = {
  getWarehouseLotAdjustmentTypesForDropdown,
  getWarehouseLotAdjustmentType,
};
