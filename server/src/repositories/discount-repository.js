const { query } = require('../database/db');
const AppError = require('../utils/AppError');

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
      AND now() BETWEEN valid_from AND COALESCE(valid_to, now())
  `;
  
  try {
    const result = await query(sql, [discountId], client);
    return result.rows[0] || null; // Return the discount object or null if not found
  } catch (error) {
    throw AppError.databaseError(`Failed to fetch discount: ${error.message}`);
  }
};

module.exports = { getValidDiscountById };
