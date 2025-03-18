const AppError = require('../utils/AppError');

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
    const { rows } = await client.query(taxRateQuery, [taxRateId]);
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
    const { rows } = client ? await client.query(queryText, [taxRateId]) : await query(queryText, [taxRateId]);
    return rows[0]?.exists || false;
  } catch (error) {
    logError('Error checking tax rate existence:', error);
    throw AppError.databaseError('Failed to check tax rate existence');
  }
};

module.exports = {
  getActiveTaxRateById,
  checkTaxRateExists,
};
