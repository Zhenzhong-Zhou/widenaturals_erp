const {
  query,
  bulkInsert,
  paginateQueryByOffset
} = require('../database/db');
const AppError = require('../utils/AppError');
const {
  logSystemException,
  logSystemInfo
} = require('../utils/system-logger');
const { buildSkuCodeBaseFilter } = require('../utils/sql/build-sku-code-base-filters');

/**
 * @async
 * @function
 * @description
 * Retrieves the existing `base_code` value for a specific `(brand_code, category_code)` pair.
 *
 * - Executes a single parameterized `SELECT` query with a `LIMIT 1`.
 * - Returns the numeric base code if found, otherwise `null`.
 * - Designed for use *within a transaction* (requires active `pg` client).
 * - Validates the data type of `base_code` for data integrity.
 *
 * **Error Handling:**
 * - Throws `AppError.validationError` if the returned `base_code` is not numeric.
 * - Throws `AppError.databaseError` if the query fails (network/transaction issues).
 *
 * @param {string} brandCode
 *   The brand code to search for (e.g., `'CH'`, `'PG'`).
 * @param {string} categoryCode
 *   The category code to search for (e.g., `'HN'`, `'NM'`).
 * @param {object} client
 *   Active PostgreSQL transaction client (`pg` client instance).
 *
 * @returns {Promise<number|null>}
 *   The numeric base code if found, or `null` if no record exists.
 *
 * @example
 * const baseCode = await getBaseCodeForBrandCategory('CH', 'HN', client);
 * if (baseCode) {
 *   console.log(`Found base code: ${baseCode}`);
 * } else {
 *   console.log('No base code found for this brand/category.');
 * }
 */
const getBaseCodeForBrandCategory = async (brandCode, categoryCode, client) => {
  const context = 'sku-code-base-repository/getBaseCodeForBrandCategory';
  
  const sql = `
    SELECT base_code
    FROM sku_code_bases
    WHERE brand_code = $1 AND category_code = $2
    LIMIT 1;
  `;
  
  const values = [brandCode, categoryCode];
  
  try {
    // Execute parameterized query
    const { rows } = await query(sql, values, client);
    
    if (!rows || rows.length === 0) {
      logSystemInfo('No base code found for given brand/category.', {
        context,
        brandCode,
        categoryCode,
      });
      return null;
    }
    
    const { base_code } = rows[0];
    
    // Validate base_code integrity
    if (typeof base_code !== 'number' || Number.isNaN(base_code)) {
      const error = new Error(`Invalid base_code type: ${typeof base_code}`);
      logSystemException(error, 'Base code type validation failed.', {
        context,
        brandCode,
        categoryCode,
        receivedValue: base_code,
      });
      throw AppError.validationError('Invalid base code format.', { context });
    }
    
    logSystemInfo('Fetched base code successfully.', {
      context,
      brandCode,
      categoryCode,
      base_code,
    });
    
    return base_code;
  } catch (error) {
    // Structured exception capture for audit traceability
    logSystemException(error, 'Failed to fetch base code for brand/category.', {
      context,
      brandCode,
      categoryCode,
    });
    
    throw AppError.databaseError('Failed to fetch base code for brand/category.', {
      cause: error,
      context,
    });
  }
};

/**
 * @async
 * @function
 * @description
 * Fetches existing base codes for multiple `(brand_code, category_code)` pairs in bulk.
 *
 * - Executes one or more parameterized SQL queries (chunked automatically for large inputs).
 * - Returns a `Map` where key = `${brandCode}-${categoryCode}`, value = `base_code`.
 * - Designed for use *within a transaction* (requires active `client`).
 *
 * **Performance:**
 * - Chunk size defaults to 500 pairs per query (safe for 1000+ total).
 * - Each query reuses prepared plan caching for efficiency.
 *
 * @param {Array<{brandCode: string, categoryCode: string}>} pairs
 *   List of brand/category pairs to check for existing base codes.
 * @param {object} client
 *   Active PostgreSQL transaction client (`pg` client instance).
 * @param {number} [chunkSize=500]
 *   Optional batch size to avoid overly large SQL statements.
 *
 * @returns {Promise<Map<string, string>>}
 *   Map of key → base_code_id for all existing base codes found in DB.
 *
 * @example
 * const existing = await getExistingBaseCodesBulk([
 *   { brandCode: 'CH', categoryCode: 'HN' },
 *   { brandCode: 'PG', categoryCode: 'NM' }
 * ], client);
 *
 * console.log(existing.get('CH-HN')); // → 'BAS-1001'
 */
const getExistingBaseCodesBulk = async (pairs, client, chunkSize = 500) => {
  const context = 'sku-code-base-repository/getExistingBaseCodesBulk';
  
  // 1. Fast exit for empty input
  if (!Array.isArray(pairs) || pairs.length === 0) {
    logSystemInfo('No base code pairs provided for lookup.', { context });
    return new Map();
  }
  
  try {
    const resultMap = new Map();
    
    // 2. Process in chunks to avoid PostgreSQL parameter limits (max ~65k)
    for (let i = 0; i < pairs.length; i += chunkSize) {
      const batch = pairs.slice(i, i + chunkSize);
      
      // Build parameterized tuple conditions dynamically
      // Example: WHERE (brand_code, category_code) IN (($1,$2),($3,$4),...)
      const placeholders = batch
        .map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`)
        .join(', ');
      const params = batch.flatMap((p) => [p.brandCode, p.categoryCode]);
      
      const sql = `
        SELECT brand_code, category_code, base_code
        FROM sku_code_bases
        WHERE (brand_code, category_code) IN (${placeholders});
      `;
      
      const { rows } = await client.query(sql, params);
      
      // Merge into result map
      for (const r of rows) {
        resultMap.set(`${r.brand_code}-${r.category_code}`, r.base_code);
      }
    }
    
    // 3. Structured summary log for observability
    logSystemInfo('Fetched existing base codes successfully.', {
      context,
      totalPairs: pairs.length,
      found: resultMap.size,
      chunks: Math.ceil(pairs.length / chunkSize),
      sample: pairs.slice(0, 3),
    });
    
    return resultMap;
  } catch (error) {
    // 4. Structured exception capture for audit traceability
    logSystemException(error, 'Failed to fetch existing base codes.', { context });
    throw AppError.databaseError('Failed to fetch existing base codes.', {
      cause: error,
      context,
    });
  }
};

/**
 * @async
 * @function
 * @description
 * Inserts new `(brand_code, category_code)` base code pairs in bulk.
 *
 * - Assumes caller has already filtered out existing pairs.
 * - Generates sequential base codes (`BASE_STEP` increments) starting from the next available block.
 * - Uses `bulkInsert` with conflict handling (`ON CONFLICT DO NOTHING`) to ensure idempotency.
 * - Designed for use *within a transaction*.
 *
 * **Performance:**
 * - Bulk insert is executed in one query (optionally chunked for >1k rows).
 * - Base code generation is arithmetic — no per-row subqueries.
 *
 * @param {Array<{brandCode: string, categoryCode: string, statusId: string, userId: string}>} pairs
 *   Array of brand/category base code objects to insert.
 * @param {object} client
 *   Active PostgreSQL transaction client (`pg` client instance).
 * @param {number} [chunkSize=1000]
 *   Optional chunk size for extremely large inserts to prevent oversized queries.
 *
 * @returns {Promise<Map<string, string>>}
 *   Map where key = `${brandCode}-${categoryCode}`, value = generated `base_code`.
 *
 * @example
 * const inserted = await insertBaseCodesBulk([
 *   { brandCode: 'CH', categoryCode: 'HN', statusId, userId },
 *   { brandCode: 'PG', categoryCode: 'NM', statusId, userId }
 * ], client);
 *
 * console.log(inserted.get('CH-HN')); // → 100
 */
const insertBaseCodesBulk = async (pairs, client, chunkSize = 1000) => {
  const context = 'sku-code-base-repository/insertBaseCodesBulk';
  const BASE_START = 100;
  const BASE_STEP = 100;
  
  // 1. Quick exit if no data provided
  if (!Array.isArray(pairs) || pairs.length === 0) {
    logSystemInfo('No base codes to insert.', { context });
    return new Map();
  }
  
  try {
    // 2. Determine the starting base code number
    const baseQuery = `
      SELECT COALESCE(MAX(base_code), ${BASE_START - BASE_STEP}) + ${BASE_STEP} AS next_base
      FROM sku_code_bases;
    `;
    const { rows: [{ next_base }] } = await query(baseQuery, [], client);
    
    // 3. Prepare insert payloads
    const columns = [
      'brand_code',
      'category_code',
      'base_code',
      'status_id',
      'created_by',
      'updated_at',
      'updated_by',
    ];
    const resultMap = new Map();
    
    // 4. Optional chunking for large inserts (defensive scaling)
    for (let i = 0; i < pairs.length; i += chunkSize) {
      const batch = pairs.slice(i, i + chunkSize);
      
      // Compute base_code sequentially (no gaps if single-threaded)
      const rows = batch.map((p, idx) => [
        p.brandCode,
        p.categoryCode,
        next_base + (i + idx) * BASE_STEP,
        p.statusId,
        p.userId,
        null,
        null,
      ]);
      
      // Conflict handling — no updates, just skip existing
      const conflictColumns = ['brand_code', 'category_code'];
      const updateStrategies = {}; // ON CONFLICT DO NOTHING
      
      // 5. Execute bulk insert
      const inserted = await bulkInsert(
        'sku_code_bases',
        columns,
        rows,
        conflictColumns,
        updateStrategies,
        client,
        { context },
        'brand_code, category_code, base_code'
      );
      
      // 6. Merge results into consolidated Map
      for (const r of inserted) {
        resultMap.set(`${r.brand_code}-${r.category_code}`, r.base_code);
      }
      
      logSystemInfo('Inserted base code batch successfully.', {
        context,
        batchSize: batch.length,
        totalInserted: resultMap.size,
      });
    }
    
    // 7. Final summary log
    logSystemInfo('Bulk base code insertion completed.', {
      context,
      totalRequested: pairs.length,
      totalInserted: resultMap.size,
      startingBase: BASE_START,
      nextAvailable: BASE_START + pairs.length * BASE_STEP,
    });
    
    return resultMap;
  } catch (error) {
    // 8. Structured error handling for traceability
    logSystemException(error, 'Failed to insert base codes in bulk.', { context });
    throw AppError.databaseError('Failed to insert base codes in bulk.', {
      cause: error,
      context,
    });
  }
};

/**
 * Fetches SKU code base records for lookup dropdowns or autocomplete components.
 *
 * This function returns a lightweight, paginated list of SKU code base rows,
 * applying optional filters such as brand_code, category_code, or keyword search.
 *
 * Intended for fast lookup use cases when generating SKUs.
 *
 * @param {Object} options - Options for the lookup query.
 * @param {Object} [options.filters={}] - Dynamic filters for brand_code, category_code, status_id, keyword, etc.
 * @param {number} [options.limit=50] - Maximum number of records to return.
 * @param {number} [options.offset=0] - Records to skip for pagination.
 *
 * @returns {Promise<{
 *   data: Array<{
 *     id: string,
 *     brand_code: string,
 *     category_code: string,
 *     base_code: number,
 *     status_id: string,
 *     has_children?: boolean
 *   }>,
 *   pagination: {
 *     offset: number,
 *     limit: number,
 *     totalRecords: number,
 *     hasMore: boolean
 *   }
 * }>}
 *
 * @throws {AppError} Throws a database error if the query fails.
 */
const getSkuCodeBaseLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = 'sku-code-base-repository/getSkuCodeBaseLookup';
  
  const tableName = 'sku_code_bases scb';
  
  // Step 1: Build dynamic WHERE clause + params
  // You will implement buildSkuCodeBaseFilter similar to buildCustomerFilter
  const { whereClause, params } = buildSkuCodeBaseFilter(filters);
  
  // Step 2: Base select query (keep payload small for dropdowns)
  const queryText = `
    SELECT
      scb.id,
      scb.brand_code,
      scb.category_code,
      scb.base_code,
      scb.status_id
    FROM ${tableName}
    LEFT JOIN status AS s ON s.id = scb.status_id
    WHERE ${whereClause}
  `;
  
  try {
    // Step 3: Execute with pagination and consistent sorting
    const result = await paginateQueryByOffset({
      tableName,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'scb.brand_code',
      sortOrder: 'ASC',
      additionalSort: 'scb.category_code ASC, scb.base_code ASC',
    });
    
    logSystemInfo('Fetched SKU code base lookup data', {
      context,
      offset,
      limit,
      filters,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch SKU code base lookup', {
      context,
      offset,
      limit,
      filters,
    });
    throw AppError.databaseError('Failed to fetch SKU code base lookup.');
  }
};

module.exports = {
  getBaseCodeForBrandCategory,
  getExistingBaseCodesBulk,
  insertBaseCodesBulk,
  getSkuCodeBaseLookup,
};
