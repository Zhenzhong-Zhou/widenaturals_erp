/**
 * @file sku-code-base-queries.js
 * @description SQL query constants and factory functions for
 * sku-code-base-repository.js.
 *
 * Exports:
 *  - SKU_CODE_BASE_GET_QUERY           — fetch single base_code by brand/category
 *  - SKU_CODE_BASE_BULK_LOOKUP_SQL     — template for bulk tuple lookup (built at call time)
 *  - SKU_CODE_BASE_NEXT_BASE_QUERY     — fetch next available base_code value
 *  - SKU_CODE_BASE_INSERT_COLUMNS      — ordered column list for bulk insert
 *  - SKU_CODE_BASE_CONFLICT_COLUMNS    — upsert conflict target columns
 *  - SKU_CODE_BASE_UPDATE_STRATEGIES   — conflict update strategies (do nothing)
 *  - SKU_CODE_BASE_LOOKUP_TABLE        — aliased table name for lookup query
 *  - SKU_CODE_BASE_LOOKUP_JOINS        — join array for lookup query
 *  - SKU_CODE_BASE_LOOKUP_SORT_WHITELIST — valid sort fields for lookup query
 *  - SKU_CODE_BASE_LOOKUP_ADDITIONAL_SORTS — tie-break sort columns for lookup
 *  - buildSkuCodeBaseLookupQuery       — factory for lookup query
 */

'use strict';

const SKU_CODE_BASE_START = 100;
const SKU_CODE_BASE_STEP = 100;

// ─── Single Record ────────────────────────────────────────────────────────────

// $1: brand_code (string), $2: category_code (string)
const SKU_CODE_BASE_GET_QUERY = `
  SELECT base_code
  FROM sku_code_bases
  WHERE brand_code = $1
    AND category_code = $2
  LIMIT 1
`;

// ─── Bulk Lookup ──────────────────────────────────────────────────────────────

// Returns a SQL string for tuple-based bulk lookup.
// Caller supplies the placeholders string built from batch size.
// Example result: WHERE (brand_code, category_code) IN (($1,$2),($3,$4))
const buildSkuCodeBaseBulkLookupSql = (placeholders) => `
  SELECT brand_code, category_code, base_code
  FROM sku_code_bases
  WHERE (brand_code, category_code) IN (${placeholders})
`;

// ─── Next Base Code ───────────────────────────────────────────────────────────

// Returns the next available base_code by incrementing the current max.
// Falls back to BASE_START if the table is empty.
const SKU_CODE_BASE_NEXT_BASE_QUERY = `
  SELECT COALESCE(MAX(base_code), ${SKU_CODE_BASE_START - SKU_CODE_BASE_STEP}) + ${SKU_CODE_BASE_STEP} AS next_base
  FROM sku_code_bases
`;

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

// Order must match the values array in insertBaseCodesBulk row map.
const SKU_CODE_BASE_INSERT_COLUMNS = [
  'brand_code',
  'category_code',
  'base_code',
  'status_id',
  'created_by',
  'updated_at',
  'updated_by',
];

// Conflict target — skip existing records, never overwrite.
const SKU_CODE_BASE_CONFLICT_COLUMNS = ['brand_code', 'category_code'];

// Empty strategies — ON CONFLICT DO NOTHING pattern.
const SKU_CODE_BASE_UPDATE_STRATEGIES = {};

// ─── Lookup Query ─────────────────────────────────────────────────────────────

const SKU_CODE_BASE_LOOKUP_TABLE = 'sku_code_bases scb';

const SKU_CODE_BASE_LOOKUP_JOINS = [
  'LEFT JOIN status AS s ON s.id = scb.status_id',
];

const SKU_CODE_BASE_LOOKUP_SORT_WHITELIST = new Set([
  'scb.brand_code',
  'scb.category_code',
  'scb.base_code',
  'scb.id',
]);

const SKU_CODE_BASE_LOOKUP_ADDITIONAL_SORTS = [
  { column: 'scb.category_code', direction: 'ASC' },
  { column: 'scb.base_code', direction: 'ASC' },
];

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildSkuCodeBaseFilter.
 * @returns {string}
 */
const buildSkuCodeBaseLookupQuery = (whereClause) => `
  SELECT
    scb.id,
    scb.brand_code,
    scb.category_code,
    scb.base_code,
    scb.status_id
  FROM ${SKU_CODE_BASE_LOOKUP_TABLE}
  LEFT JOIN status AS s ON s.id = scb.status_id
  WHERE ${whereClause}
`;

module.exports = {
  SKU_CODE_BASE_START,
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
};
