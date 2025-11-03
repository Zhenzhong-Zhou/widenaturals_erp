const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');

/**
 * Fetches the base code for a given brand code and category code.
 * Used as the starting point for generating SKU numeric sequences.
 *
 * @param {string} brandCode - Short code for the brand (e.g., 'CH')
 * @param {string} categoryCode - Short code for the category (e.g., 'HN')
 * @returns {Promise<number|null>} The base_code if found, or null if not found.
 * @throws {AppError} When a database error occurs.
 */
const getBaseCodeForBrandCategory = async (brandCode, categoryCode) => {
  const sql = `
    SELECT base_code
    FROM sku_code_bases
    WHERE brand_code = $1 AND category_code = $2
    LIMIT 1
  `;

  const values = [brandCode, categoryCode];

  try {
    const { rows } = await query(sql, values);

    if (!rows || rows.length === 0) return null;

    const { base_code } = rows[0];

    if (typeof base_code !== 'number') {
      logSystemException(
        new Error('Invalid base_code type'),
        '[getBaseCodeForBrandCategory] base_code is not a number',
        {
          context: 'sku-code-base-repository/getBaseCodeForBrandCategory',
          brandCode,
          categoryCode,
          base_code,
        }
      );
      throw AppError.validationError('Invalid base code format.');
    }

    return base_code;
  } catch (error) {
    logSystemException(
      error,
      '[getBaseCodeForBrandCategory] Failed to fetch base code',
      {
        context: 'sku-code-base-repository/getBaseCodeForBrandCategory',
        brandCode,
        categoryCode,
      }
    );

    throw AppError.databaseError(
      'Failed to fetch base code for brand/category'
    );
  }
};

/**
 * Fetches the brand_code and category_code from sku_code_bases using case-insensitive match.
 * Used for dynamic SKU generation logic.
 *
 * @param {string} brand - Brand name, e.g. 'Canaherb'
 * @param {string} category - Category name, e.g. 'Herbal Natural'
 * @returns {Promise<{ brandCode: string, categoryCode: string }>}
 * @throws {AppError} If no matching entry is found or query fails
 */
const getBrandCategoryCodes = async (brand, category) => {
  const sql = `
    SELECT brand_code, category_code
    FROM sku_code_bases
    WHERE LOWER(brand_code) = LOWER($1)
      AND LOWER(category_code) = LOWER($2)
    LIMIT 1
  `;

  const values = [brand, category];

  try {
    const { rows } = await query(sql, values);

    if (!rows || rows.length === 0) {
      logSystemException(
        new Error('brand/category not found in sku_code_bases'),
        '[getBrandCategoryCodes] No matching entry found',
        {
          context: 'sku-code-base-repository/getBrandCategoryCodes',
          brand,
          category,
        }
      );
      throw AppError.validationError(
        `No SKU code base mapping found for brand "${brand}" and category "${category}".`
      );
    }

    const { brand_code, category_code } = rows[0];

    return {
      brandCode: brand_code,
      categoryCode: category_code,
    };
  } catch (error) {
    logSystemException(
      error,
      '[getBrandCategoryCodes] Failed to fetch brand/category codes',
      {
        context: 'sku-code-base-repository/getBrandCategoryCodes',
        brand,
        category,
      }
    );

    throw AppError.databaseError(
      'Failed to resolve brand/category code from sku_code_bases'
    );
  }
};

module.exports = {
  getBaseCodeForBrandCategory,
  getBrandCategoryCodes,
};
