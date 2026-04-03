/**
 * @file sku-code-base-repository.js
 * @description Database access layer for SKU code base records.
 *
 * Follows the established repo pattern:
 *  - Query constants and factories imported from sku-code-base-queries.js
 *  - All errors normalized through handleDbError before bubbling up
 *  - No success logging — middleware and globalErrorHandler own that layer
 *
 * Exports:
 *  - getBaseCodeForBrandCategory  — fetch single base_code by brand/category
 *  - getExistingBaseCodesBulk     — bulk fetch base_codes for brand/category pairs
 *  - insertBaseCodesBulk          — bulk insert new base_code records
 *  - getSkuCodeBaseLookup         — offset-paginated dropdown lookup
 */

'use strict';

const { query, bulkInsert } = require('../database/db');
const { validateBulkInsertRows } = require('../utils/validation/bulk-insert-row-validator');
const { paginateQueryByOffset } = require('../database/utils/pagination/pagination-helpers');
const AppError = require('../utils/AppError');
const { handleDbError } = require('../utils/errors/error-handlers');
const { logDbQueryError, logBulkInsertError } = require('../utils/db-logger');
const { buildSkuCodeBaseFilter } = require('../utils/sql/build-sku-code-base-filter');
const {
  SKU_CODE_BASE_STEP,
  SKU_CODE_BASE_GET_QUERY,
  buildSkuCodeBaseBulkLookupSql,
  SKU_CODE_BASE_NEXT_BASE_QUERY,
  SKU_CODE_BASE_INSERT_COLUMNS,
  SKU_CODE_BASE_CONFLICT_COLUMNS,
  SKU_CODE_BASE_UPDATE_STRATEGIES,
  SKU_CODE_BASE_LOOKUP_TABLE,
  SKU_CODE_BASE_LOOKUP_JOINS,
  SKU_CODE_BASE_LOOKUP_SORT_WHITELIST,
  SKU_CODE_BASE_LOOKUP_ADDITIONAL_SORTS,
  buildSkuCodeBaseLookupQuery,
} = require('./queries/sku-code-base-queries');

// ─── Single Record ────────────────────────────────────────────────────────────

/**
 * Fetches the base_code for a given brand/category combination.
 *
 * Returns null if no record exists.
 * Validates that the returned base_code is a valid number — throws a
 * validation error if the DB returns an unexpected type.
 *
 * Validation is outside the try block — AppError.validationError must
 * not be caught and re-thrown as a databaseError.
 *
 * @param {string}                  brandCode    - Brand code string.
 * @param {string}                  categoryCode - Category code string.
 * @param {PoolClient} client       - DB client for transactional context.
 *
 * @returns {Promise<number|null>} The base_code, or null if not found.
 * @throws  {AppError}              Validation error if base_code type is unexpected.
 * @throws  {AppError}              Normalized database error if the query fails.
 */
const getBaseCodeForBrandCategory = async (brandCode, categoryCode, client) => {
  const context = 'sku-code-base-repository/getBaseCodeForBrandCategory';
  const params  = [brandCode, categoryCode];
  
  let rows;
  
  try {
    ({ rows } = await query(SKU_CODE_BASE_GET_QUERY, params, client));
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch base code for brand/category.',
      meta:    { brandCode, categoryCode },
      logFn:   (err) => logDbQueryError(
        SKU_CODE_BASE_GET_QUERY, params, err, { context, brandCode, categoryCode }
      ),
    });
  }
  
  if (!rows.length) return null;
  
  const { base_code } = rows[0];
  
  // Validation outside try — base_code type check is a data integrity guard,
  // not a DB error. Must not be swallowed by the IO catch block.
  if (typeof base_code !== 'number' || Number.isNaN(base_code)) {
    throw AppError.validationError('Invalid base code format.', {
      context,
      meta: { brandCode, categoryCode, receivedValue: base_code },
    });
  }
  
  return base_code;
};

// ─── Bulk Lookup ──────────────────────────────────────────────────────────────

/**
 * Fetches existing base_codes for a batch of brand/category pairs.
 *
 * Splits into chunks of `chunkSize` to avoid PostgreSQL parameter limits.
 * Returns a Map keyed by `"brand_code-category_code"`.
 *
 * @param {Array<{ brandCode: string, categoryCode: string }>} pairs
 * @param {PoolClient} client
 * @param {number} [chunkSize=500]
 *
 * @returns {Promise<Map<string, number>>} Map of composite key → base_code.
 * @throws  {AppError} Normalized database error if any chunk query fails.
 */
const getExistingBaseCodesBulk = async (pairs, client, chunkSize = 500) => {
  if (!Array.isArray(pairs) || pairs.length === 0) return new Map();
  
  const context   = 'sku-code-base-repository/getExistingBaseCodesBulk';
  const resultMap = new Map();
  
  try {
    for (let i = 0; i < pairs.length; i += chunkSize) {
      const batch        = pairs.slice(i, i + chunkSize);
      const placeholders = batch
        .map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`)
        .join(', ');
      const params = batch.flatMap((p) => [p.brandCode, p.categoryCode]);
      const sql    = buildSkuCodeBaseBulkLookupSql(placeholders);
      
      // Uses shared query() utility — not client.query() directly.
      const { rows } = await query(sql, params, client);
      
      for (const r of rows) {
        resultMap.set(`${r.brand_code}-${r.category_code}`, r.base_code);
      }
    }
    
    return resultMap;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch existing base codes.',
      meta:    { totalPairs: pairs.length },
      logFn:   (err) => logDbQueryError(
        'bulk tuple lookup', [], err, { context, totalPairs: pairs.length }
      ),
    });
  }
};

// ─── Bulk Insert ──────────────────────────────────────────────────────────────

/**
 * Bulk inserts new base_code records for brand/category pairs.
 *
 * Base codes are assigned sequentially starting from the current max + STEP.
 * On conflict (brand_code + category_code already exists), the insert is skipped.
 * Splits into chunks of `chunkSize` for large payloads.
 *
 * Returns a Map keyed by `"brand_code-category_code"` containing only
 * the newly inserted records.
 *
 * @param {Array<{ brandCode: string, categoryCode: string, statusId: string, userId: string }>} pairs
 * @param {PoolClient} client
 * @param {number} [chunkSize=1000]
 *
 * @returns {Promise<Map<string, number>>} Map of composite key → base_code for inserted records.
 * @throws  {AppError} Normalized database error if any insert fails.
 */
const insertBaseCodesBulk = async (pairs, client, chunkSize = 1000) => {
  if (!Array.isArray(pairs) || pairs.length === 0) return new Map();
  
  const context   = 'sku-code-base-repository/insertBaseCodesBulk';
  const resultMap = new Map();
  
  let next_base;
  
  try {
    const { rows: baseRows } = await query(SKU_CODE_BASE_NEXT_BASE_QUERY, [], client);
    next_base = /** @type {{ next_base: number }} */ (baseRows[0]);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch next base code.',
      meta:    { totalPairs: pairs.length },
      logFn:   (err) => logDbQueryError(
        SKU_CODE_BASE_NEXT_BASE_QUERY, [], err, { context }
      ),
    });
  }
  
  try {
    for (let i = 0; i < pairs.length; i += chunkSize) {
      const batch = pairs.slice(i, i + chunkSize);
      
      const rows = batch.map((p, idx) => [
        p.brandCode,
        p.categoryCode,
        next_base + (i + idx) * SKU_CODE_BASE_STEP,
        p.statusId,
        p.userId,
        null,   // updated_at — null at insert time
        null,   // updated_by — null at insert time
      ]);
      
      validateBulkInsertRows(rows, SKU_CODE_BASE_INSERT_COLUMNS.length);
      
      const inserted = await bulkInsert(
        'sku_code_bases',
        SKU_CODE_BASE_INSERT_COLUMNS,
        rows,
        SKU_CODE_BASE_CONFLICT_COLUMNS,
        SKU_CODE_BASE_UPDATE_STRATEGIES,
        client,
        { meta: context },
        'brand_code, category_code, base_code'
      );
      
      for (const r of inserted) {
        resultMap.set(`${r.brand_code}-${r.category_code}`, r.base_code);
      }
    }
    
    return resultMap;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to insert base codes in bulk.',
      meta:    { totalPairs: pairs.length },
      logFn:   (err) => logBulkInsertError(
        err,
        'sku_code_bases',
        [],
        pairs.length,
        { context, conflictColumns: SKU_CODE_BASE_CONFLICT_COLUMNS }
      ),
    });
  }
};

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated SKU code base records for dropdown/lookup use.
 *
 * @param {Object} params
 * @param {Object} [params.filters={}] - Optional filters.
 * @param {number} [params.limit=50]   - Max records per page.
 * @param {number} [params.offset=0]   - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getSkuCodeBaseLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = 'sku-code-base-repository/getSkuCodeBaseLookup';
  
  const { whereClause, params } = buildSkuCodeBaseFilter(filters);
  const queryText = buildSkuCodeBaseLookupQuery(whereClause);
  
  try {
    return await paginateQueryByOffset({
      tableName:       SKU_CODE_BASE_LOOKUP_TABLE,
      joins:           SKU_CODE_BASE_LOOKUP_JOINS,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy:          'scb.brand_code',
      sortOrder:       'ASC',
      additionalSorts: SKU_CODE_BASE_LOOKUP_ADDITIONAL_SORTS,
      whitelistSet:    SKU_CODE_BASE_LOOKUP_SORT_WHITELIST,
    });
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to fetch SKU code base lookup.',
      meta:    { filters, limit, offset },
      logFn:   (err) => logDbQueryError(
        queryText, params, err, { context, filters, limit, offset }
      ),
    });
  }
};

module.exports = {
  getBaseCodeForBrandCategory,
  getExistingBaseCodesBulk,
  insertBaseCodesBulk,
  getSkuCodeBaseLookup,
};
