const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Retrieves a valid discount by ID.
 * Ensures the discount is within its valid time range.
 *
 * @param {UUID} discountId - The ID of the discount to fetch.
 * @param {Object} client - Optional transaction client.
 * @returns {Promise<Object|null>} - The discount details or null if not found.
 */
const getValidDiscountById = async (discountId, client = null) => {
  if (!discountId) return null; // Return null if no discount is provided

  const sql = `
    SELECT discount_type, discount_value
    FROM discounts
    WHERE id = $1
      AND NOW() BETWEEN valid_from AND COALESCE(valid_to, NOW())
  `;

  try {
    const result = await query(sql, [discountId], client);
    return result.rows[0] || null; // Return the discount object or null if not found
  } catch (error) {
    throw AppError.databaseError(`Failed to fetch discount: ${error.message}`);
  }
};

/**
 * Fetches active and valid discounts with a timeout query.
 * @returns {Promise<Array>} - List of discounts (id, name, type, value).
 */
const getActiveDiscounts = async () => {
  try {
    const queryText = `
      SELECT
          d.id,
          d.name,
          d.discount_type,
          d.discount_value
      FROM discounts d
      JOIN status s ON d.status_id = s.id
      WHERE
          s.name = 'active'
          AND (d.valid_to IS NULL OR d.valid_to >= NOW())
      ORDER BY d.name ASC;
    `;

    const { rows } = await query(queryText);
    return rows;
  } catch (error) {
    logError('Error fetching active discounts:', error);
    throw AppError.databaseError('Failed to fetch active discounts');
  }
};

module.exports = {
  getValidDiscountById,
  getActiveDiscounts,
};
