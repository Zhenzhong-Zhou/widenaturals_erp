/**
 * @file product-queries.js
 * @description SQL query constants and factory functions for product-repository.js.
 *
 * Exports:
 *  - PRODUCT_INSERT_COLUMNS        — ordered column list for bulk insert
 *  - PRODUCT_CONFLICT_COLUMNS      — upsert conflict target columns
 *  - PRODUCT_UPDATE_STRATEGIES     — conflict update strategies
 *  - PRODUCT_TABLE                 — aliased table name for paginated query
 *  - PRODUCT_JOINS                 — join array for paginated query
 *  - PRODUCT_SORT_WHITELIST        — valid sort fields for paginated query
 *  - buildProductPaginatedQuery    — factory for paginated list query
 *  - PRODUCT_DETAILS_QUERY         — full detail fetch by product id
 *  - PRODUCT_LOOKUP_TABLE          — aliased table name for lookup query
 *  - PRODUCT_LOOKUP_JOINS          — join array for lookup query
 *  - PRODUCT_LOOKUP_SORT_WHITELIST — valid sort fields for lookup query
 *  - PRODUCT_LOOKUP_ADDITIONAL_SORTS — tie-break sort columns for lookup
 *  - buildProductLookupQuery       — factory for lookup query
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Insert / Upsert ──────────────────────────────────────────────────────────

// Order must match the values array in insertProductsBulk row map.
const PRODUCT_INSERT_COLUMNS = [
  'name',
  'series',
  'brand',
  'category',
  'description',
  'status_id',
  'created_by',
  'updated_by',
  'updated_at',
];

// Conflict target: a product is considered duplicate when all three match.
const PRODUCT_CONFLICT_COLUMNS = ['name', 'brand', 'category'];

const PRODUCT_UPDATE_STRATEGIES = {
  description: 'overwrite',
  status_id:   'overwrite',
  status_date: 'overwrite',
  updated_by:  'overwrite',
  updated_at:  'overwrite',
};

// ─── Paginated List ───────────────────────────────────────────────────────────

const PRODUCT_TABLE = 'products p';

const PRODUCT_JOINS = [
  'LEFT JOIN status s  ON p.status_id  = s.id',
  'LEFT JOIN users  cu ON p.created_by = cu.id',
  'LEFT JOIN users  uu ON p.updated_by = uu.id',
];

const _PRODUCT_JOINS_SQL = PRODUCT_JOINS.join('\n  ');

const PRODUCT_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.productSortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildProductFilter.
 * @returns {string}
 */
const buildProductPaginatedQuery = (whereClause) => `
  SELECT
    p.id,
    p.name,
    p.brand,
    p.category,
    p.series,
    s.name                        AS status_name,
    p.status_id,
    p.status_date,
    p.created_at,
    p.updated_at,
    p.created_by,
    p.updated_by,
    cu.firstname                  AS created_by_firstname,
    cu.lastname                   AS created_by_lastname,
    uu.firstname                  AS updated_by_firstname,
    uu.lastname                   AS updated_by_lastname
  FROM ${PRODUCT_TABLE}
  ${_PRODUCT_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Detail ───────────────────────────────────────────────────────────────────

// $1: product_id (UUID)
const PRODUCT_DETAILS_QUERY = `
  SELECT
    p.id,
    p.name,
    p.series,
    p.brand,
    p.category,
    p.description,
    s.id                          AS status_id,
    s.name                        AS status_name,
    p.status_date,
    p.created_at,
    p.updated_at,
    p.created_by,
    cb.firstname                  AS created_by_firstname,
    cb.lastname                   AS created_by_lastname,
    p.updated_by,
    ub.firstname                  AS updated_by_firstname,
    ub.lastname                   AS updated_by_lastname
  FROM products AS p
  LEFT JOIN status AS s  ON p.status_id  = s.id
  LEFT JOIN users  AS cb ON p.created_by = cb.id
  LEFT JOIN users  AS ub ON p.updated_by = ub.id
  WHERE p.id = $1
`;

// ─── Lookup Query ─────────────────────────────────────────────────────────────

const PRODUCT_LOOKUP_TABLE = 'products p';

// Status join included — filter builder may apply status conditions.
const PRODUCT_LOOKUP_JOINS = [
  'LEFT JOIN status AS s ON s.id = p.status_id',
];

const _PRODUCT_LOOKUP_JOINS_SQL = PRODUCT_LOOKUP_JOINS.join('\n  ');

const PRODUCT_LOOKUP_SORT_WHITELIST = new Set([
  'p.name',
  'p.brand',
  'p.category',
]);

const PRODUCT_LOOKUP_ADDITIONAL_SORTS = [
  { column: 'p.brand',    direction: 'ASC' },
  { column: 'p.category', direction: 'ASC' },
];

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildProductFilter.
 * @returns {string}
 */
const buildProductLookupQuery = (whereClause) => `
  SELECT
    p.id,
    p.name,
    p.brand,
    p.category,
    p.status_id
  FROM ${PRODUCT_LOOKUP_TABLE}
  ${_PRODUCT_LOOKUP_JOINS_SQL}
  WHERE ${whereClause}
`;

module.exports = {
  PRODUCT_INSERT_COLUMNS,
  PRODUCT_CONFLICT_COLUMNS,
  PRODUCT_UPDATE_STRATEGIES,
  PRODUCT_TABLE,
  PRODUCT_JOINS,
  PRODUCT_SORT_WHITELIST,
  buildProductPaginatedQuery,
  PRODUCT_DETAILS_QUERY,
  PRODUCT_LOOKUP_TABLE,
  PRODUCT_LOOKUP_JOINS,
  PRODUCT_LOOKUP_SORT_WHITELIST,
  PRODUCT_LOOKUP_ADDITIONAL_SORTS,
  buildProductLookupQuery,
};
