/**
 * @file pricing-queries.js
 * @description SQL query constants and factory functions for pricing-repository.js.
 *
 * Exports:
 *  - PRICING_SKU_LIST_TABLE          — aliased table name for paginated SKU list query
 *  - PRICING_SKU_LIST_JOINS          — join array for SKU list query
 *  - PRICING_SKU_LIST_SORT_WHITELIST — valid sort fields for SKU list query
 *  - buildPricingSkuListQuery        — factory for SKU-granular queries (filtered search, per-group SKU table, export base)
 *  - buildPricingExportQuery         — factory for full export query
 *  - PRICING_BY_SKU_QUERY            — fetch all pricing groups a SKU belongs to
 *  - PRICING_BY_GROUP_AND_SKU_BATCH_QUERY — batch fetch price by (pricing_group_id, sku_id) pairs
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── SKU-Granular Query (filtered search, detail SKU table, export base) ─────

const PRICING_SKU_LIST_TABLE = 'pricing p';

const PRICING_SKU_LIST_JOINS = [
  'JOIN pricing_groups pg ON pg.id  = p.pricing_group_id',
  'JOIN pricing_types  pt ON pt.id  = pg.pricing_type_id',
  'JOIN status         st ON st.id  = pg.status_id',
  'JOIN skus           s  ON s.id   = p.sku_id',
  'JOIN products       pr ON pr.id  = s.product_id',
];

const _PRICING_SKU_LIST_JOINS_SQL = PRICING_SKU_LIST_JOINS.join('\n  ');

const PRICING_SKU_LIST_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.pricingSkuListSortMap)
);

/**
 * Base SKU-level query across pricing, pricing_groups, skus, and products.
 * Used for filtered SKU search, per-group SKU table, and export.
 * Scope is determined entirely by the whereClause passed in.
 *
 * @param {string} whereClause
 * @returns {string}
 */
const buildPricingSkuListQuery = (whereClause) => `
  SELECT
    p.id                          AS pricing_id,
    pg.id                         AS pricing_group_id,
    pt.id                         AS pricing_type_id,
    pt.name                       AS pricing_type_name,
    pt.code                       AS pricing_type_code,
    pg.country_code,
    pg.price,
    pg.valid_from,
    pg.valid_to,
    pg.status_id,
    st.name                       AS status_name,
    s.id                          AS sku_id,
    s.sku,
    s.barcode,
    s.size_label,
    s.country_code                AS sku_country_code,
    pr.id                         AS product_id,
    pr.name                       AS product_name,
    pr.brand,
    pr.category
  FROM ${PRICING_SKU_LIST_TABLE}
  ${_PRICING_SKU_LIST_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * @param {string} whereClause
 * @returns {string}
 */
const buildPricingExportQuery = (whereClause) => `
  SELECT
    pt.name                       AS pricing_type_name,
    pt.code                       AS pricing_type_code,
    pg.country_code,
    pg.price,
    pg.valid_from,
    pg.valid_to,
    st.name                       AS status_name,
    s.sku,
    s.barcode,
    s.size_label,
    s.country_code                AS sku_country_code,
    pr.name                       AS product_name,
    pr.brand,
    pr.category,
    pg.created_at,
    pg.updated_at,
    cu.firstname                  AS created_by_firstname,
    cu.lastname                   AS created_by_lastname,
    uu.firstname                  AS updated_by_firstname,
    uu.lastname                   AS updated_by_lastname
  FROM pricing p
  JOIN  pricing_groups pg ON pg.id  = p.pricing_group_id
  JOIN  pricing_types  pt ON pt.id  = pg.pricing_type_id
  JOIN  status         st ON st.id  = pg.status_id
  JOIN  skus           s  ON s.id   = p.sku_id
  JOIN  products       pr ON pr.id  = s.product_id
  LEFT JOIN users      uc ON uc.id  = pg.created_by
  LEFT JOIN users      uu ON uu.id  = pg.updated_by
  WHERE ${whereClause}
  ORDER BY pt.name ASC, pg.country_code ASC, pg.price ASC, pr.name ASC
`;

// ─── By SKU ───────────────────────────────────────────────────────────────────

// $1: sku_id (UUID)
const PRICING_BY_SKU_QUERY = `
  SELECT
    p.id                          AS pricing_id,
    p.sku_id,
    p.pricing_group_id,
    pg.pricing_type_id,
    pt.name                       AS price_type_name,
    pt.code                       AS price_type_code,
    pg.country_code,
    pg.price,
    pg.valid_from,
    pg.valid_to,
    pg.status_id,
    pg.status_date,
    pg.created_at,
    pg.updated_at,
    pg.created_by,
    u1.firstname                  AS created_by_firstname,
    u1.lastname                   AS created_by_lastname,
    pg.updated_by,
    u2.firstname                  AS updated_by_firstname,
    u2.lastname                   AS updated_by_lastname
  FROM pricing p
  JOIN  pricing_groups pg ON pg.id              = p.pricing_group_id
  JOIN  pricing_types  pt ON pt.id              = pg.pricing_type_id
  LEFT JOIN users      u1 ON u1.id              = pg.created_by
  LEFT JOIN users      u2 ON u2.id              = pg.updated_by
  WHERE p.sku_id = $1
  ORDER BY pt.code ASC, pg.country_code ASC, pg.valid_from DESC
`;

// ─── Batch by (pricing_group_id, sku_id) pairs ───────────────────────────────

const PRICING_BY_GROUP_AND_SKU_BATCH_QUERY = `
  WITH input(pricing_group_id, sku_id) AS (
    SELECT * FROM UNNEST($1::uuid[], $2::uuid[])
  )
  SELECT
    i.pricing_group_id,
    i.sku_id,
    pg.price
  FROM input i
  JOIN pricing        p  ON p.pricing_group_id = i.pricing_group_id
                        AND p.sku_id           = i.sku_id
  JOIN pricing_groups pg ON pg.id              = i.pricing_group_id
`;

module.exports = {
  PRICING_SKU_LIST_TABLE,
  PRICING_SKU_LIST_JOINS,
  PRICING_SKU_LIST_SORT_WHITELIST,
  buildPricingSkuListQuery,
  buildPricingExportQuery,
  PRICING_BY_SKU_QUERY,
  PRICING_BY_GROUP_AND_SKU_BATCH_QUERY,
};
