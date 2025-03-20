const wrapAsync = require('../utils/wrap-async');
const { fetchTaxRatesForDropdown } = require('../services/tax-rate-service');

/**
 * Controller to get tax rates for dropdown
 */
const getTaxRatesForDropdownController = wrapAsync(async (req, res, next) => {
  try {
    const { region, province } = req.query; // Optionally receive region and province
    const taxRates = await fetchTaxRatesForDropdown(region, province);
    res.json(taxRates);
  } catch (error) {
    next(error);
  }
});

module.exports = {
  getTaxRatesForDropdownController
};
