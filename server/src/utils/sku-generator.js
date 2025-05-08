const { getLastSku } = require('../repositories/sku-repository');
const { getBaseCodeForBrandCategory } = require('../repositories/sku-code-base-repository');
const { logError } = require('./logger-helper');
const AppError = require('./AppError');

/**
 * Generates a formatted SKU string based on brand, category, variant, and region like PG-NM101-R-CA.
 * Ensures uniqueness in-memory for bulk operations.
 *
 * @param {string} brandCode - Short brand identifier (e.g., 'PG')
 * @param {string} categoryCode - Category code (e.g., 'NM')
 * @param {string} variantCode - Variant identifier (e.g., 'R' for Regular)
 * @param {string} regionCode - ISO 3166-1 country code (e.g., 'CA', 'INT')
 * @param {Map<string, number>} lastUsedCodeMap - In-memory tracker for the last used SKU code per brand-category combination.
 * @returns {Promise<string>} - A generated SKU string
 */
const generateSKU = async (brandCode, categoryCode, variantCode, regionCode, lastUsedCodeMap) => {
  try {
    if (!brandCode || !categoryCode || !variantCode || !regionCode) {
      throw AppError.validationError('Missing required parameters for SKU generation.');
    }
    // Validate format
    const validate = (code, regex, label) => {
      if (!regex.test(code)) throw AppError.validationError(`Invalid ${label} format.`);
    };
    validate(brandCode, /^[A-Z]{2,5}$/, 'brand code');
    validate(categoryCode, /^[A-Z]{2,5}$/, 'category code');
    validate(variantCode, /^[A-Z]$/, 'variant code');
    validate(regionCode, /^[A-Z]{2,5}$/, 'region code');
    
    const key = `${brandCode}-${categoryCode}`;
    let currentCode;
    
    if (lastUsedCodeMap.has(key)) {
      currentCode = lastUsedCodeMap.get(key) + 1;
    } else {
      const baseCode = await getBaseCodeForBrandCategory(brandCode, categoryCode);
      if (!baseCode) {
        throw AppError.validationError(`No base code found for ${key}`);
      }
      
      const lastSku = await getLastSku(brandCode, categoryCode);
      const match = lastSku?.match(/^[A-Z]{2}-[A-Z]{2}(\d{3})-[A-Z]-[A-Z]{2,}$/);
      const lastCode = match ? parseInt(match[1], 10) : null;
      
      currentCode = lastCode !== null ? lastCode + 1 : baseCode;
    }
    
    lastUsedCodeMap.set(key, currentCode);
    
    const codeStr = String(currentCode).padStart(3, '0');
    return `${brandCode}-${categoryCode}${codeStr}-${variantCode}-${regionCode}`;
  } catch (error) {
    logError('[generateSKU] Failed to generate SKU');
    throw AppError.generalError('Failed to generate SKU');
  }
};

module.exports = {
  generateSKU,
};
