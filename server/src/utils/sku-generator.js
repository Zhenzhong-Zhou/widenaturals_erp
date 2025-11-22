const { getLastSku } = require('../repositories/sku-repository');
const {
  getBaseCodeForBrandCategory,
} = require('../repositories/sku-code-base-repository');
const { logSystemError, logSystemInfo } = require('./system-logger');
const AppError = require('./AppError');
const normalizeError = require('./normalize-error');

/**
 * @async
 * @function
 * @description
 * Generates a formatted SKU string following the standardized pattern:
 * **{brandCode}-{categoryCode}{baseCode}-{variantCode}-{regionCode}**,
 * for example: `"PG-NM101-R-CA"`.
 *
 * - Ensures **sequential numbering** per `(brandCode, categoryCode)` combination.
 * - Checks against the database (via `client`) to fetch or initialize the latest `base_code`
 *   using the `sku_code_bases` table.
 * - Uses an in-memory `lastUsedCodeMap` to maintain incremental uniqueness within a bulk insert session.
 * - Intended to be **called within a transaction** to ensure consistency.
 *
 * @param {string} brandCode - Short brand identifier (e.g. `"PG"`).
 * @param {string} categoryCode - Product category code (e.g. `"NM"`).
 * @param {string} variantCode - Variant identifier (e.g. `"R"` for Regular, `"S"` for Softgel).
 * @param {string} regionCode - ISO 3166-1 country code or market region (e.g. `"CA"`, `"CN"`, `"INT"`).
 * @param {Map<string, number>} lastUsedCodeMap - In-memory tracker mapping `"brand-category"` → last used numeric suffix.
 * @param {object} client - Active PostgreSQL transaction client for querying and updating the `sku_code_bases` table.
 * @returns {Promise<string>} A newly generated, unique SKU code string (e.g. `"PG-NM101-R-CA"`).
 *
 * @example
 * const sku = await generateSKU('PG', 'NM', 'R', 'CA', lastUsedCodeMap, client);
 * // → "PG-NM101-R-CA"
 */
const generateSKU = async (
  brandCode,
  categoryCode,
  variantCode,
  regionCode,
  lastUsedCodeMap,
  client
) => {
  const context = 'generate-sku';

  try {
    // Validate required parameters
    if (!brandCode || !categoryCode || !variantCode || !regionCode) {
      throw AppError.validationError(
        'Missing required parameters for SKU generation.',
        { context }
      );
    }

    // Format validators
    const validate = (code, regex, label) => {
      if (!regex.test(code)) {
        throw AppError.validationError(`Invalid ${label} format.`, {
          context,
          details: { value: code },
        });
      }
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
      const baseCode = await getBaseCodeForBrandCategory(
        brandCode,
        categoryCode,
        client
      );
      if (!baseCode) {
        throw AppError.validationError(`No base code found for ${key}`, {
          context,
        });
      }

      const lastSku = await getLastSku(brandCode, categoryCode);
      const match = lastSku?.match(
        /^[A-Z]{2}-[A-Z]{2}(\d{3})-[A-Z]-[A-Z]{2,}$/
      );
      const lastCode = match ? parseInt(match[1], 10) : null;

      currentCode = lastCode !== null ? lastCode + 1 : baseCode;
    }

    lastUsedCodeMap.set(key, currentCode);
    const codeStr = String(currentCode).padStart(3, '0');
    const generatedSku = `${brandCode}-${categoryCode}${codeStr}-${variantCode}-${regionCode}`;

    logSystemInfo('SKU generated successfully.', {
      context,
      sku: generatedSku,
      key,
      currentCode,
    });

    return generatedSku;
  } catch (error) {
    const normalized = normalizeError(error, {
      context,
      type: 'SKUGenerationError',
      code: 'SKU_GENERATION_FAILURE',
    });

    logSystemError('[generateSKU] Failed to generate SKU', {
      ...normalized.toLog(),
    });
    throw normalized;
  }
};

module.exports = {
  generateSKU,
};
