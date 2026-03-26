/**
 * @file generate-sku.js
 * @description Utility for generating formatted SKU strings within a database
 * transaction. Intended to be called from the service layer inside a
 * transaction block — never directly from a controller or route handler.
 *
 * Generated SKU format:
 *   {brandCode}-{categoryCode}{baseCode}-{variantCode}-{regionCode}
 *   e.g. "PG-NM101-R-CA"
 *
 * Sequential numbering is maintained per (brandCode, categoryCode) combination
 * via two mechanisms:
 *   1. `lastUsedCodeMap` — in-memory tracker for uniqueness within a bulk
 *      insert session (avoids redundant DB reads within the same transaction).
 *   2. `getLastSku` — DB query for the latest numeric suffix across all
 *      previously committed SKUs for the same brand/category pair.
 *
 * Error handling:
 *   All errors are normalized to AppError at the source before being thrown.
 *   Callers do not need to wrap calls in try/catch for normalization — they
 *   only need to handle or rethrow AppError instances.
 */

'use strict';

const AppError = require('./AppError');
const { getLastSku }                  = require('../repositories/sku-repository');
const { getBaseCodeForBrandCategory } = require('../repositories/sku-code-base-repository');
const { logSystemInfo }               = require('./logging/system-logger');

const CONTEXT = 'utils/generate-sku';

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

/**
 * Validates a SKU component against a format regex.
 * Throws a validation AppError immediately if the format is invalid.
 *
 * @param {string} value - The value to validate.
 * @param {RegExp} regex - Expected format pattern.
 * @param {string} label - Human-readable field name for the error message.
 * @throws {AppError} If `value` does not match `regex`.
 */
const assertFormat = (value, regex, label) => {
  if (!regex.test(value)) {
    throw AppError.validationError(`Invalid ${label} format: "${value}".`, {
      meta: { value },
    });
  }
};

// -----------------------------------------------------------------------------
// SKU generator
// -----------------------------------------------------------------------------

/**
 * Generates a formatted SKU string within an active PostgreSQL transaction.
 *
 * Sequential numbering per (brandCode, categoryCode):
 *   - If `lastUsedCodeMap` already has an entry for the brand/category key,
 *     increments it in-memory (avoids a DB read during bulk inserts).
 *   - Otherwise queries `sku_code_bases` for the configured base code and
 *     `skus` for the last used numeric suffix, then increments from there.
 *
 * Must be called inside a transaction — `client` is used for both reads and
 * writes to `sku_code_bases` to ensure consistency under concurrent inserts.
 *
 * @param {string}              brandCode       - Short brand identifier (e.g. `'PG'`).
 * @param {string}              categoryCode    - Product category code (e.g. `'NM'`).
 * @param {string}              variantCode     - Variant identifier (e.g. `'R'`).
 * @param {string}              regionCode      - ISO 3166-1 country/market code (e.g. `'CA'`).
 * @param {Map<string, number>} lastUsedCodeMap - In-memory map of `'brand-category'` →
 *   last used numeric suffix. Mutated in-place by this function.
 * @param {object}              client          - Active pg transaction client.
 * @returns {Promise<string>} Generated SKU string (e.g. `'PG-NM101-R-CA'`).
 * @throws {AppError} If any parameter is missing, malformed, or DB lookups fail.
 *
 * @example
 * const sku = await generateSKU('PG', 'NM', 'R', 'CA', lastUsedCodeMap, client);
 * // → 'PG-NM101-R-CA'
 */
const generateSKU = async (
  brandCode,
  categoryCode,
  variantCode,
  regionCode,
  lastUsedCodeMap,
  client
) => {
  // ---------------------------------------------------------------------------
  // 1. Presence check — all four codes are required
  // ---------------------------------------------------------------------------
  if (!brandCode || !categoryCode || !variantCode || !regionCode) {
    throw AppError.validationError(
      'Missing required parameters for SKU generation.',
      { meta: { brandCode, categoryCode, variantCode, regionCode } }
    );
  }
  
  // ---------------------------------------------------------------------------
  // 2. Format validation — fail fast before any DB interaction
  // ---------------------------------------------------------------------------
  assertFormat(brandCode,    /^[A-Z]{2,5}$/, 'brand code');
  assertFormat(categoryCode, /^[A-Z]{2,5}$/, 'category code');
  assertFormat(variantCode,  /^[A-Z]$/,      'variant code');
  assertFormat(regionCode,   /^[A-Z]{2,5}$/, 'region code');
  
  // ---------------------------------------------------------------------------
  // 3. Resolve numeric suffix
  // ---------------------------------------------------------------------------
  const key = `${brandCode}-${categoryCode}`;
  let currentCode;
  
  if (lastUsedCodeMap.has(key)) {
    // In-memory increment — avoids a DB read during bulk inserts within the
    // same transaction session.
    currentCode = lastUsedCodeMap.get(key) + 1;
  } else {
    // First occurrence of this brand/category pair in this session —
    // query DB for the configured base code and the last used suffix.
    const baseCode = await getBaseCodeForBrandCategory(
      brandCode,
      categoryCode,
      client
    );
    
    if (!baseCode) {
      throw AppError.serviceError(
        `No base code configured for brand/category combination: ${key}.`,
        { meta: { brandCode, categoryCode } }
      );
    }
    
    const lastSku = await getLastSku(brandCode, categoryCode);
    
    // Extract the numeric suffix from the last SKU for this brand/category.
    // Pattern: {BRAND}-{CATEGORY}{NNN}-{VARIANT}-{REGION}
    const match    = lastSku?.match(/^[A-Z]{2,5}-[A-Z]{2,5}(\d{3})-[A-Z]-[A-Z]{2,5}$/);
    const lastCode = match ? parseInt(match[1], 10) : null;
    
    // Start from lastCode + 1 if a prior SKU exists, otherwise use baseCode
    // as the starting point for this brand/category series.
    currentCode = lastCode !== null ? lastCode + 1 : baseCode;
  }
  
  // ---------------------------------------------------------------------------
  // 4. Assemble SKU string
  // ---------------------------------------------------------------------------
  lastUsedCodeMap.set(key, currentCode);
  
  // Zero-pad the numeric suffix to 3 digits (e.g. 1 → '001', 99 → '099').
  const codeStr      = String(currentCode).padStart(3, '0');
  const generatedSku = `${brandCode}-${categoryCode}${codeStr}-${variantCode}-${regionCode}`;
  
  logSystemInfo('SKU generated successfully.', {
    context: CONTEXT,
    sku:         generatedSku,
    key,
    currentCode,
  });
  
  return generatedSku;
};

module.exports = {
  generateSKU,
};
