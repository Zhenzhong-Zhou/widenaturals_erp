
const { logError } = require('../utils/logger-helper');
const { query } = require('../database/db');
const AppError = require('../utils/AppError');

/**
 * Fetches the base code for a given brand code and category code.
 * This is used as the starting point for generating SKU numeric sequences.
 *
 * @param {string} brandCode - Short code for the brand (e.g., 'CH')
 * @param {string} categoryCode - Short code for the category (e.g., 'HN')
 * @returns {Promise<number|null>} The base_code if found, or null if not found
 */
const getBaseCodeForBrandCategory = async (brandCode, categoryCode) => {
  try {
    const sql = `
      SELECT base_code
      FROM sku_code_bases
      WHERE brand_code = $1 AND category_code = $2
      LIMIT 1
    `;
    
    const values = [brandCode, categoryCode];
    const { rows } = await query(sql, values);
    
    return rows.length ? rows[0].base_code : null;
  } catch (error) {
    logError?.('[getBaseCodeForBrandCategory] Failed to fetch base code', error);
    throw AppError.databaseError('Failed to fetch base code for brand/category');
  }
};


/**
 * Fetches the brand_code and category_code from sku_code_bases using case-insensitive match.
 * Used for dynamic SKU generation logic.
 *
 * @param {string} brand - Brand name, e.g. 'Canaherb'
 * @param {string} category - Category name, e.g. 'Herbal Natural'
 * @returns {Promise<{ brandCode: string, categoryCode: string }>}
 * @throws {Error} If no matching entry is found
 */
const getBrandCategoryCodes = async (brand, category) => {
  try {
    const sql = `
      SELECT brand_code, category_code
      FROM sku_code_bases
      WHERE LOWER(brand_code) = LOWER($1)
        AND LOWER(category_code) = LOWER($2)
      LIMIT 1
    `;
    
    const values = [brand, category];
    const { rows } = await query(sql, values);
    
    if (rows.length) {
      return {
        brandCode: rows[0].brand_code,
        categoryCode: rows[0].category_code,
      };
    }
    
    throw new AppError.databaseError(`sku_code_bases missing for brand: "${brand}", category: "${category}"`);
  } catch (err) {
    logError('[getBrandCategoryCodes] Failed to fetch:', err.message);
    throw AppError.databaseError('Failed to resolve brand/category code from sku_code_bases');
  }
};

module.exports = {
  getBaseCodeForBrandCategory,
  getBrandCategoryCodes
};
