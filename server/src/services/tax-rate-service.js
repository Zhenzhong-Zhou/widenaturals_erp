const {
  getTaxRatesForDropdown,
} = require('../repositories/tax-rate-repository');
const AppError = require('../utils/AppError');

/**
 * Service function to get formatted tax rates for dropdown usage.
 *
 * @param {string} region - Region name to filter by (e.g., 'Canada').
 * @param {string|null} province - Province name to filter by (optional).
 * @returns {Promise<Array<{ value: string, label: string }>>}
 */
const fetchTaxRatesForDropdown = async (region = 'Canada', province = null) => {
  try {
    const taxRates = await getTaxRatesForDropdown(region, province);

    // Formatting data for dropdown usage
    return taxRates.map((rate) => ({
      value: rate.id,
      label: `${rate.name} (${rate.rate}%)`,
    }));
  } catch (error) {
    throw AppError.serviceError('Unable to process tax rates for dropdown.');
  }
};

module.exports = {
  fetchTaxRatesForDropdown,
};
