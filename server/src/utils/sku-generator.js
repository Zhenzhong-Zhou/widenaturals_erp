const { getLastSku } = require('../repositories/sku-repository');
const { getBaseCodeForBrandCategory } = require('../repositories/sku-code-base-repository');
const { logError } = require('./logger-helper');
const AppError = require('./AppError');

/**
 * Generates a formatted SKU string like PG-NM101-R-CA.
 *
 * @param {string} brandCode - Short brand identifier (e.g., 'PG')
 * @param {string} categoryCode - Category code (e.g., 'NM')
 * @param {string} variantCode - Variant identifier (e.g., 'R' for Regular)
 * @param {string} regionCode - ISO 3166-1 country code (e.g., 'CA', 'INT')
 * @returns {Promise<string>} - A generated SKU string
 */
const generateSKU = async (brandCode, categoryCode, variantCode, regionCode) => {
  try {
    // --- Validation ---
    if (!brandCode || !categoryCode || !variantCode || !regionCode) {
      throw AppError.validationError('Missing required parameters for SKU generation.');
    }
    if (!/^[A-Z]{2,5}$/.test(brandCode)) {
      throw AppError.validationError('Invalid brand code format.');
    }
    if (!/^[A-Z]{2,5}$/.test(categoryCode)) {
      throw AppError.validationError('Invalid category code format.');
    }
    if (!/^[A-Z]$/.test(variantCode)) {
      throw AppError.validationError('Variant code must be a single uppercase letter.');
    }
    if (!/^[A-Z]{2,5}$/.test(regionCode)) {
      throw AppError.validationError('Invalid region code format.');
    }
    
    // --- Get base code from sku_code_bases ---
    const baseCode = await getBaseCodeForBrandCategory(brandCode, categoryCode);
    if (!baseCode) {
      throw AppError.validationError(`No base code found for ${brandCode}-${categoryCode}`);
    }
    
    // --- Get latest matching SKU ---
    const lastSku = await getLastSku(brandCode, categoryCode);
    let newCode = baseCode;
    if (lastSku) {
      const match = lastSku.match(/^[A-Z]{2}-[A-Z]{2}(\d{3})-[A-Z]-[A-Z]{2,}$/);
      if (match) {
        const lastCode = parseInt(match[1], 10);
        if (!isNaN(lastCode)) newCode = lastCode + 1;
      }
    }
    
    const codeStr = String(newCode).padStart(3, '0');
    return `${brandCode}-${categoryCode}${codeStr}-${variantCode}-${regionCode}`;
  } catch (error) {
    logError('[generateSKU] Failed to generate SKU');
    throw AppError.generalError('Failed to generate SKU');
  }
};

module.exports = {
  generateSKU,
};
