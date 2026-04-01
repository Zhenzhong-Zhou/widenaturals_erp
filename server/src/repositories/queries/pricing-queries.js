/**
 * @file pricing-queries.js
 * @description SQL query constants and factory functions for pricing-repository.js.
 *
 * Exports:
 *  - PRICING_TABLE                      — aliased table name for paginated queries
 *  - PRICING_JOINS                      — standard join array for paginated queries
 *  - PRICING_SORT_WHITELIST             — valid sort fields for paginated query
 *  - buildPricingSelectQuery            — factory for main paginated/export query
 *  - PRICING_DETAILS_TABLE              — aliased table name for details query
 *  - PRICING_DETAILS_JOINS              — join array for details query
 *  - PRICING_DETAILS_SORT_WHITELIST     — valid sort fields for details query
 *  - buildPricingDetailsQuery           — factory for details by pricing type id
 *  - PRICING_LOOKUP_TABLE               — aliased table name for lookup query
 *  - PRICING_LOOKUP_JOINS               — join array for lookup query
 *  - PRICING_LOOKUP_SORT_WHITELIST      — valid sort fields for lookup query
 *  - PRICING_LOOKUP_ADDITIONAL_SORTS    — tie-break sort columns for lookup
 *  - buildPricingLookupQuery            — factory for lookup query
 *  - PRICING_BY_SKU_QUERY               — fetch all pricing rows for a SKU
 *  - PRICING_BY_ID_AND_SKU_BATCH_QUERY  — batch fetch by price_id + sku_id pairs
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Paginated / Export ───────────────────────────────────────────────────────

const PRICING_TABLE = 'pricing p';

const PRICING_JOINS = [
  'JOIN pricing_types pt ON pt.id = p.price_type_id',
  'JOIN skus          s  ON s.id  = p.sku_id',
  'JOIN products      pr ON pr.id = s.product_id',
];

const _PRICING_JOINS_SQL = PRICING_JOINS.join('\n  ');

const PRICING_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.pricingSortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildPricingFilters.
 * @returns {string}
 */
const buildPricingSelectQuery = (whereClause) => `
  SELECT
    p.id                          AS pricing_id,
    p.price,
    p.valid_from,
    p.valid_to,
    pt.id                         AS pricing_type_id,
    pt.name                       AS pricing_type,
    pt.code                       AS pricing_type_code,
    pt.slug                       AS pricing_type_slug,
    s.id                          AS sku_id,
    s.sku,
    s.country_code,
    s.size_label,
    s.barcode,
    pr.id                         AS product_id,
    pr.name                       AS product_name,
    pr.brand
  FROM ${PRICING_TABLE}
  ${_PRICING_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Details By Pricing Type ──────────────────────────────────────────────────

const PRICING_DETAILS_TABLE = 'pricing p';

const PRICING_DETAILS_JOINS = [
  'JOIN  pricing_types pt  ON pt.id  = p.price_type_id',
  'JOIN  skus          s   ON s.id   = p.sku_id',
  'JOIN  products      pr  ON pr.id  = s.product_id',
  'LEFT JOIN locations   l   ON l.id   = p.location_id',
  'LEFT JOIN status      pts ON pts.id = p.status_id',
  'LEFT JOIN users       uc  ON uc.id  = p.created_by',
  'LEFT JOIN users       uu  ON uu.id  = p.updated_by',
];

const _PRICING_DETAILS_JOINS_SQL = PRICING_DETAILS_JOINS.join('\n  ');

const PRICING_DETAILS_SORT_WHITELIST = new Set([
  'pt.name',
  'l.name',
  'p.price',
  'p.valid_from',
  'p.valid_to',
  'pts.name',
  's.sku',
  's.country_code',
  's.size_label',
  'pr.name',
  'pr.brand',
  'p.location_id',
]);

// WHERE clause is always p.price_type_id = $1 — static, no factory needed.
// $1: pricing_type_id (UUID)
const buildPricingDetailsQuery = () => `
  SELECT
    pt.name                       AS pricing_type,
    p.location_id,
    l.name                        AS location_name,
    p.price,
    p.valid_from,
    p.valid_to,
    p.status_id                   AS pricing_status_id,
    pts.name                      AS pricing_status_name,
    p.created_at                  AS pricing_created_at,
    uc.firstname                  AS created_by_firstname,
    uc.lastname                   AS created_by_lastname,
    p.updated_at                  AS pricing_updated_at,
    p.updated_by                  AS pricing_updated_by,
    uu.firstname                  AS updated_by_firstname,
    uu.lastname                   AS updated_by_lastname,
    s.sku,
    s.barcode,
    s.country_code,
    s.size_label,
    pr.name                       AS product_name,
    pr.brand                      AS brand_name,
    COUNT(DISTINCT s.id)          AS product_count
  FROM ${PRICING_DETAILS_TABLE}
  ${_PRICING_DETAILS_JOINS_SQL}
  WHERE p.price_type_id = $1
  GROUP BY
    pt.name, p.location_id, l.name, p.price, p.valid_from, p.valid_to,
    p.status_id, pts.name, p.created_at, uc.firstname, uc.lastname,
    p.updated_at, p.updated_by, uu.firstname, uu.lastname,
    s.sku, s.barcode, s.country_code, s.size_label, pr.name, pr.brand
`;

// ─── Lookup Query ─────────────────────────────────────────────────────────────

const PRICING_LOOKUP_TABLE = 'pricing p';

const PRICING_LOOKUP_JOINS = [
  'JOIN  skus          s  ON s.id  = p.sku_id',
  'JOIN  pricing_types pt ON pt.id = p.price_type_id',
  'JOIN  products      pr ON pr.id = s.product_id',
  'LEFT JOIN locations l  ON l.id  = p.location_id',
];

const _PRICING_LOOKUP_JOINS_SQL = PRICING_LOOKUP_JOINS.join('\n  ');

const PRICING_LOOKUP_SORT_WHITELIST = new Set([
  'pt.name',
  'p.valid_from',
  'p.id',
]);

// Primary sort is pt.name — valid_from is the tie-breaker only.
const PRICING_LOOKUP_ADDITIONAL_SORTS = [
  { column: 'p.valid_from', direction: 'DESC' },
];

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildPricingFilters.
 * @returns {string}
 */
const buildPricingLookupQuery = (whereClause) => `
  SELECT
    p.id,
    p.price,
    pt.name                       AS price_type,
    pr.name                       AS product_name,
    pr.brand,
    s.sku,
    s.barcode,
    s.size_label,
    s.country_code,
    l.name                        AS location_name,
    p.valid_from,
    p.valid_to,
    p.status_id
  FROM ${PRICING_LOOKUP_TABLE}
  ${_PRICING_LOOKUP_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── By SKU ───────────────────────────────────────────────────────────────────

// $1: sku_id (UUID)
const PRICING_BY_SKU_QUERY = `
  SELECT
    pr.id,
    pr.sku_id,
    pr.price_type_id,
    pt.name                       AS price_type_name,
    pt.code                       AS price_type_code,
    pr.location_id,
    l.name                        AS location_name,
    lt.name                       AS location_type,
    pr.price,
    pr.valid_from,
    pr.valid_to,
    pr.status_id,
    pr.status_date,
    pr.created_at,
    pr.updated_at,
    pr.created_by,
    u1.firstname                  AS created_by_firstname,
    u1.lastname                   AS created_by_lastname,
    pr.updated_by,
    u2.firstname                  AS updated_by_firstname,
    u2.lastname                   AS updated_by_lastname
  FROM pricing pr
  LEFT JOIN pricing_types  pt ON pr.price_type_id    = pt.id
  LEFT JOIN locations      l  ON pr.location_id      = l.id
  LEFT JOIN location_types lt ON l.location_type_id  = lt.id
  LEFT JOIN users          u1 ON pr.created_by       = u1.id
  LEFT JOIN users          u2 ON pr.updated_by       = u2.id
  WHERE pr.sku_id = $1
  ORDER BY pt.code ASC, pr.valid_from DESC
`;

// ─── Batch Fetch By ID + SKU Pairs ────────────────────────────────────────────

// Fetches only rows where both price_id and sku_id match — returns matched
// pairs only, silently drops unmatched inputs.
// $1: price_ids (UUID array), $2: sku_ids (UUID array)
const PRICING_BY_ID_AND_SKU_BATCH_QUERY = `
  WITH input(price_id, sku_id) AS (
    SELECT * FROM UNNEST($1::uuid[], $2::uuid[])
  )
  SELECT i.price_id, i.sku_id, p.price
  FROM input i
  JOIN pricing p
    ON p.id     = i.price_id
   AND p.sku_id = i.sku_id
`;

module.exports = {
  PRICING_TABLE,
  PRICING_JOINS,
  PRICING_SORT_WHITELIST,
  buildPricingSelectQuery,
  PRICING_DETAILS_TABLE,
  PRICING_DETAILS_JOINS,
  PRICING_DETAILS_SORT_WHITELIST,
  buildPricingDetailsQuery,
  PRICING_LOOKUP_TABLE,
  PRICING_LOOKUP_JOINS,
  PRICING_LOOKUP_SORT_WHITELIST,
  PRICING_LOOKUP_ADDITIONAL_SORTS,
  buildPricingLookupQuery,
  PRICING_BY_SKU_QUERY,
  PRICING_BY_ID_AND_SKU_BATCH_QUERY,
};
