const { query, getUniqueScalarValue } = require('../database/db');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Retrieves the tax rate value by its ID.
 *
 * @param {UUID} taxRateId - The ID of the tax rate to fetch.
 * @param {object} [client=null] - Optional database client/transaction.
 * @returns {Promise<number|null>} - The tax rate (e.g., 0.05) or null if not found.
 * @throws {AppError} - If the database query fails.
 */
const getTaxRateById = async (taxRateId, client = null) => {
  try {
    return await getUniqueScalarValue(
      {
        table: 'tax_rates',
        where: { id: taxRateId },
        select: 'rate',
      },
      client,
      {
        context: 'tax-rate-repository/getTaxRateById',
        taxRateId,
      }
    );
  } catch (error) {
    // getUniqueScalarValue already throws with proper context and logs
    throw error;
  }
};

/**
 * Fetches active tax rates for a dropdown.
 * Filters by:
 * - `is_active = true`
 * - `valid_from <= NOW()`
 * - `valid_to IS NULL OR valid_to > NOW()`
 *
 * @param {string} region - Optional region filter (e.g., 'Canada')
 * @param {string|null} province - Optional province filter (e.g., 'Ontario')
 * @returns {Promise<Array<{ id: string, name: string, rate: string }>>}
 */
const getTaxRatesForDropdown = async (region = 'Canada', province = null) => {
  try {
    const baseQuery = `
      SELECT id, name, rate
      FROM tax_rates
      WHERE is_active = true
        AND valid_from <= NOW()
        AND (valid_to IS NULL OR valid_to > NOW())
        AND region = $1
        ${province ? `AND province = $2` : ''}
      ORDER BY name ASC;
    `;

    const values = province ? [region, province] : [region];

    const { rows } = await query(baseQuery, values);

    return rows;
  } catch (error) {
    logError('Error fetching tax rates for dropdown:', error);
    throw AppError.databaseError('Failed to fetch tax rates for dropdown.');
  }
};

module.exports = {
  getTaxRateById,
  getTaxRatesForDropdown,
};
