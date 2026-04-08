/**
 * @file pricing-group-queries.js
 * @description SQL query constants and factory functions for pricing-group-repository.js.
 *
 * Exports:
 *  - PRICING_GROUP_LIST_TABLE           — aliased table name for group list query
 *  - PRICING_GROUP_LIST_JOINS           — join array for group list query
 *  - PRICING_GROUP_LIST_SORT_WHITELIST  — valid sort keys for group list query
 *  - buildPricingGroupListQuery         — factory for pricing group list (with SKU/product counts)
 *  - PRICING_GROUP_BY_ID_QUERY          — full detail fetch by id
 *  - PRICING_GROUP_LOOKUP_TABLE         — aliased table name for lookup query
 *  - PRICING_GROUP_LOOKUP_JOINS         — join array for lookup query
 *  - PRICING_GROUP_LOOKUP_SORT_WHITELIST— valid sort keys for lookup query
 *  - PRICING_GROUP_LOOKUP_ADDITIONAL_SORTS — tie-break sorts for lookup query
 *  - buildPricingGroupLookupQuery       — factory for dropdown/lookup query
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Group List ───────────────────────────────────────────────────────────────

const PRICING_GROUP_LIST_TABLE = 'pricing_groups pg';

const PRICING_GROUP_LIST_JOINS = [
  'JOIN      pricing_types pt ON pt.id              = pg.pricing_type_id',
  'JOIN      status        st ON st.id              = pg.status_id',
  'LEFT JOIN pricing       p  ON p.pricing_group_id = pg.id',
  'LEFT JOIN skus          s  ON s.id               = p.sku_id',
];

const _PRICING_GROUP_LIST_JOINS_SQL = PRICING_GROUP_LIST_JOINS.join('\n  ');

const PRICING_GROUP_LIST_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.pricingGroupListSortMap)
);

/**
 * @param {string} whereClause
 * @returns {string}
 */
const buildPricingGroupListQuery = (whereClause) => `
  SELECT
    pg.id,
    pg.pricing_type_id,
    pt.name                       AS pricing_type_name,
    pt.code                       AS pricing_type_code,
    pg.country_code,
    pg.price,
    pg.valid_from,
    pg.valid_to,
    pg.status_id,
    st.name                       AS status_name,
    pg.status_date,
    COUNT(DISTINCT p.sku_id)      AS sku_count,
    COUNT(DISTINCT s.product_id)  AS product_count,
    pg.updated_at
  FROM ${PRICING_GROUP_LIST_TABLE}
  ${_PRICING_GROUP_LIST_JOINS_SQL}
  WHERE ${whereClause}
  GROUP BY
    pg.id, pg.pricing_type_id, pt.name, pt.code, pg.country_code,
    pg.price, pg.valid_from, pg.valid_to, pg.status_id, st.name,
    pg.status_date, pg.updated_at
`;

// ─── By ID ────────────────────────────────────────────────────────────────────

const PRICING_GROUP_BY_ID_QUERY = `
  SELECT
    pg.id,
    pg.pricing_type_id,
    pt.name                       AS pricing_type_name,
    pt.code                       AS pricing_type_code,
    pg.country_code,
    pg.price,
    pg.valid_from,
    pg.valid_to,
    pg.status_id,
    st.name                       AS status_name,
    pg.status_date,
    pg.created_at,
    pg.updated_at,
    pg.created_by,
    pg.updated_by,
    uc.firstname                  AS created_by_firstname,
    uc.lastname                   AS created_by_lastname,
    uu.firstname                  AS updated_by_firstname,
    uu.lastname                   AS updated_by_lastname
  FROM pricing_groups pg
  JOIN  pricing_types pt ON pt.id = pg.pricing_type_id
  JOIN  status        st ON st.id = pg.status_id
  LEFT JOIN users     uc ON uc.id = pg.created_by
  LEFT JOIN users     uu ON uu.id = pg.updated_by
  WHERE pg.id = $1
`;

// ─── Lookup ───────────────────────────────────────────────────────────────────

const PRICING_GROUP_LOOKUP_TABLE = 'pricing_groups pg';

const PRICING_GROUP_LOOKUP_JOINS = [
  'JOIN pricing       p  ON p.pricing_group_id = pg.id',
  'JOIN skus          s  ON s.id               = p.sku_id',
  'JOIN pricing_types pt ON pt.id              = pg.pricing_type_id',
  'JOIN products      pr ON pr.id              = s.product_id',
];

const _PRICING_GROUP_LOOKUP_JOINS_SQL = PRICING_GROUP_LOOKUP_JOINS.join('\n  ');

const PRICING_GROUP_LOOKUP_SORT_WHITELIST = new Set([
  'pt.name',
  'pg.valid_from',
  'pg.id',
]);

const PRICING_GROUP_LOOKUP_ADDITIONAL_SORTS = [
  { column: 'pg.valid_from', direction: 'DESC' },
];

/**
 * @param {string} whereClause
 * @returns {string}
 */
const buildPricingGroupLookupQuery = (whereClause) => `
  SELECT
    pg.id                         AS pricing_group_id,
    pg.price,
    pg.country_code,
    pt.name                       AS price_type,
    pr.name                       AS product_name,
    pr.brand,
    s.sku,
    s.barcode,
    s.size_label,
    s.country_code                AS sku_country_code,
    pg.valid_from,
    pg.valid_to,
    pg.status_id
  FROM ${PRICING_GROUP_LOOKUP_TABLE}
  ${_PRICING_GROUP_LOOKUP_JOINS_SQL}
  WHERE ${whereClause}
`;

module.exports = {
  PRICING_GROUP_LIST_TABLE,
  PRICING_GROUP_LIST_JOINS,
  PRICING_GROUP_LIST_SORT_WHITELIST,
  buildPricingGroupListQuery,
  PRICING_GROUP_BY_ID_QUERY,
  PRICING_GROUP_LOOKUP_TABLE,
  PRICING_GROUP_LOOKUP_JOINS,
  PRICING_GROUP_LOOKUP_SORT_WHITELIST,
  PRICING_GROUP_LOOKUP_ADDITIONAL_SORTS,
  buildPricingGroupLookupQuery,
};
