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

module.exports = {
  getActiveTaxRateById,
};
