const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { query } = require('../database/db');

const getActiveTaxRateById = async (taxRateId, client) => {
  if (!taxRateId) return null; // Ensure `null` is handled properly

  const taxRateQuery = `
    SELECT rate
    FROM tax_rates
    WHERE id = $1
      AND is_active = true
      AND NOW() BETWEEN valid_from AND COALESCE(valid_to, NOW())
    LIMIT 1;
  `;

  try {
    const { rows } = await query(taxRateQuery, [taxRateId], client);
    return rows.length ? rows[0].rate : null;
  } catch (error) {
    throw AppError.databaseError(`Failed to fetch tax rate: ${error.message}`);
  }
};

/**
 * Repository function to check if a tax rate exists by ID.
 * @param {string} taxRateId - The UUID of the tax rate.
 * @param {object} client - Database transaction client (optional for transactions).
 * @returns {Promise<boolean>} - Returns true if the tax rate exists, otherwise false.
 */
const checkTaxRateExists = async (taxRateId, client = null) => {
  try {
    const queryText = `SELECT EXISTS (SELECT 1 FROM tax_rates WHERE id = $1) AS exists;`;
    const { rows } = await query(queryText, [taxRateId], client);
    return rows[0]?.exists || false;
  } catch (error) {
    logError('Error checking tax rate existence:', error);
    throw AppError.databaseError('Failed to check tax rate existence');
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
  getActiveTaxRateById,
  checkTaxRateExists,
  getTaxRatesForDropdown,
};
