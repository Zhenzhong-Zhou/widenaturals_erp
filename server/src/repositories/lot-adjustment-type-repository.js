const { query, paginateQuery, retry } = require('../database/db');
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
    throw new AppError('Database error: Failed to fetch warehouse lot adjustment types.');
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
    const { rows } = await pool.query(queryText);
    return rows;
  } catch (error) {
    logError('Error fetching active warehouse lot adjustment types:', error);
    throw new AppError('Database error: Failed to fetch active warehouse lot adjustment types.');
  }
};

/**
 * Fetch a specific warehouse lot adjustment type by ID.
 * @param {string} adjustmentTypeId - The ID of the adjustment type.
 * @returns {Promise<{ id: string, name: string } | null>} - Adjustment type details.
 */
const getWarehouseLotAdjustmentTypeById = async (adjustmentTypeId) => {
  const queryText = `
    SELECT id, name
    FROM lot_adjustment_types
    WHERE id = $1
    LIMIT 1;
  `;
  
  try {
    const { rows } = await query(queryText, [adjustmentTypeId]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logError(`Error fetching warehouse lot adjustment type with ID: ${adjustmentTypeId}`, error);
    throw new AppError(`Database error: Failed to fetch warehouse lot adjustment type with ID ${adjustmentTypeId}`);
  }
};

module.exports = {
  getWarehouseLotAdjustmentTypes,
  getWarehouseLotAdjustmentTypeById,
};
