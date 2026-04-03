/**
 * @file sku-base-code-service.js
 * @description Business logic for SKU base code resolution.
 *
 * Exports:
 *   - getOrCreateBaseCodesBulk – resolves or creates base codes for brand/category pairs
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { deduplicatePairs }         = require('../utils/array-utils');
const {
  getExistingBaseCodesBulk,
  insertBaseCodesBulk,
}                                  = require('../repositories/sku-code-base-repository');
const AppError                     = require('../utils/AppError');

const CONTEXT = 'sku-service';

/**
 * Resolves base code IDs for a list of brand/category pairs, creating any that
 * do not yet exist.
 *
 * Deduplicates input pairs, fetches all existing base codes in a single query,
 * inserts any missing ones, and returns a consolidated map of `brand-category` → base code ID.
 *
 * Returns an empty Map if the input is empty or produces no unique pairs.
 *
 * @param {Array<{ brandCode: string, categoryCode: string }>} pairs  - Brand/category pairs to resolve.
 * @param {PoolClient}                            client - DB client for transactional context.
 *
 * @returns {Promise<Map<string, number>>} Map of `'brandCode-categoryCode'` → base code ID.
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const getOrCreateBaseCodesBulk = async (pairs, client) => {
  const context = `${CONTEXT}/getOrCreateBaseCodesBulk`;
  
  try {
    if (!Array.isArray(pairs) || pairs.length === 0) return new Map();
    
    const uniquePairs = deduplicatePairs(pairs, (p) => `${p.brandCode}-${p.categoryCode}`);
    
    if (uniquePairs.length === 0) return new Map();
    
    // 1. Fetch all existing base codes in one query.
    const existingMap = await getExistingBaseCodesBulk(uniquePairs, client);
    
    // 2. Determine which pairs are missing.
    const missing = uniquePairs.filter(
      (p) => !existingMap.has(`${p.brandCode}-${p.categoryCode}`)
    );
    
    // 3. Insert missing base codes and merge into the consolidated map.
    if (missing.length > 0) {
      const insertedMap = await insertBaseCodesBulk(
        /** @type {Array<{ brandCode: string, categoryCode: string, statusId: string, userId: string }>} */ (missing),
        client
      );
      
      for (const [key, value] of insertedMap.entries()) {
        existingMap.set(key, value);
      }
    }
    
    return existingMap;
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch or create base codes.', {
      meta: { error: error.message, context },
    });
  }
};

module.exports = {
  getOrCreateBaseCodesBulk,
};
