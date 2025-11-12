const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { deduplicatePairs } = require('../utils/array-utils');
const { getExistingBaseCodesBulk, insertBaseCodesBulk } = require('../repositories/sku-code-base-repository');
const AppError = require('../utils/AppError');

/**
 * @function
 * @description
 * Ensures that all `(brand_code, category_code)` base code pairs exist in the database.
 *
 * - Checks existing base codes in bulk (minimizes round-trips).
 * - Inserts only missing combinations.
 * - Returns a consolidated Map of all pairs → base_code_id.
 *
 * This function is meant to be called *inside a transaction* and is safe for
 * concurrent use because upstream service locks relevant parent resources.
 *
 * @param {Array<{brandCode: string, categoryCode: string, statusId: string, userId: string}>} pairs
 *   List of brand/category base pairs to ensure exist.
 * @param {object} client - Active database transaction client (pg Client).
 * @returns {Promise<Map<string, string>>}
 *   Map where key = `${brandCode}-${categoryCode}`, value = base_code_id.
 *
 * @example
 * const baseMap = await getOrCreateBaseCodesBulk([
 *   { brandCode: 'CH', categoryCode: 'HN', statusId, userId },
 *   { brandCode: 'PG', categoryCode: 'NM', statusId, userId }
 * ], client);
 *
 * const baseId = baseMap.get('CH-HN'); // → UUID
 */
const getOrCreateBaseCodesBulk = async (pairs, client) => {
  const context = 'sku-service/getOrCreateBaseCodesBulk';
  try {
    // 1. Validate input early
    if (!Array.isArray(pairs) || pairs.length === 0) {
      logSystemInfo('No base codes to process.', { context });
      return new Map();
    }
    
    // Deduplicate brand/category combinations
    const uniquePairs = deduplicatePairs(pairs, (p) => `${p.brandCode}-${p.categoryCode}`);
    
    if (uniquePairs.length === 0) {
      logSystemInfo('No base codes to process.', { context });
      return new Map();
    }
    
    // 2. Fetch all existing base codes in one query
    const existingMap = await getExistingBaseCodesBulk(uniquePairs, client);
    
    // 3. Determine which pairs are missing
    const missing = uniquePairs.filter(
      (p) => !existingMap.has(`${p.brandCode}-${p.categoryCode}`)
    );
    
    // 4. Insert missing base codes (if any)
    if (missing.length > 0) {
      const insertedMap = await insertBaseCodesBulk(missing, client);
      
      // Merge newly inserted base codes into the existing map
      for (const [key, value] of insertedMap.entries()) {
        existingMap.set(key, value);
      }
      
      logSystemInfo('Inserted missing base codes.', {
        context,
        insertedCount: insertedMap.size,
        totalRequested: pairs.length,
      });
    } else {
      logSystemInfo('All requested base codes already exist.', {
        context,
        totalRequested: pairs.length,
      });
    }
    
    // 5. Return consolidated map
    return existingMap;
  } catch (error) {
    logSystemException(error, 'Failed to fetch or create base codes in bulk.', { context });
    throw AppError.databaseError('Failed to fetch or create base codes.', {
      cause: error,
      context,
    });
  }
};

module.exports = {
  getOrCreateBaseCodesBulk,
};
