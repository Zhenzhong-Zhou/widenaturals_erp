/**
 * @file pricing-type-queries.js
 * @description SQL query constants and factory functions for
 * pricing-type-repository.js.
 *
 * Exports:
 *  - PRICING_TYPE_TABLE               — aliased table name for paginated query
 *  - PRICING_TYPE_JOINS               — join array for paginated query
 *  - PRICING_TYPE_SORT_WHITELIST      — valid sort fields for paginated query
 *  - buildPricingTypePaginatedQuery   — factory for paginated list query
 *  - PRICING_TYPE_GET_BY_ID_QUERY     — full detail fetch by id
 *  - PRICING_TYPE_EXISTS_QUERY        — existence check by id
 *  - PRICING_TYPE_DROPDOWN_QUERY      — dropdown fetch by product id
 */

'use strict';

// ─── Paginated List ───────────────────────────────────────────────────────────

const PRICING_TYPE_TABLE = 'pricing_types pt';

const PRICING_TYPE_JOINS = [
  'JOIN      status s  ON pt.status_id  = s.id',
  'LEFT JOIN users  cu ON pt.created_by = cu.id',
  'LEFT JOIN users  uu ON pt.updated_by = uu.id',
];

const _PRICING_TYPE_JOINS_SQL = PRICING_TYPE_JOINS.join('\n  ');

const PRICING_TYPE_SORT_WHITELIST = new Set([
  'pt.name',
  'pt.code',
  'pt.slug',
  'pt.description',
  'pt.status_date',
  'pt.created_at',
  'pt.updated_at',
  'pt.id',
  's.name',
]);

/**
 * @param {string} whereClause - Parameterised WHERE predicate.
 * @returns {string}
 */
const buildPricingTypePaginatedQuery = (whereClause) => `
  SELECT
    pt.id,
    pt.name,
    pt.code,
    pt.slug,
    pt.description,
    s.name                        AS status,
    pt.status_date,
    pt.created_at,
    pt.updated_at,
    CONCAT(COALESCE(cu.firstname, ''), ' ', COALESCE(cu.lastname, '')) AS created_by_fullname,
    CONCAT(COALESCE(uu.firstname, ''), ' ', COALESCE(uu.lastname, '')) AS updated_by_fullname
  FROM ${PRICING_TYPE_TABLE}
  ${_PRICING_TYPE_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Single Record ────────────────────────────────────────────────────────────

// $1: pricing_type_id (UUID)
const PRICING_TYPE_GET_BY_ID_QUERY = `
  SELECT
    pt.id                         AS pricing_type_id,
    pt.name                       AS pricing_type_name,
    pt.code                       AS pricing_type_code,
    pt.slug                       AS pricing_type_slug,
    pt.description                AS pricing_type_description,
    pt.status_id,
    status.name                   AS status_name,
    pt.status_date,
    pt.created_at                 AS pricing_type_created_at,
    pt.updated_at                 AS pricing_type_updated_at,
    created_by_user.id            AS created_by_id,
    created_by_user.firstname     AS created_by_firstname,
    created_by_user.lastname      AS created_by_lastname,
    updated_by_user.id            AS updated_by_id,
    updated_by_user.firstname     AS updated_by_firstname,
    updated_by_user.lastname      AS updated_by_lastname
  FROM pricing_types pt
  LEFT JOIN status            ON pt.status_id  = status.id
  LEFT JOIN users created_by_user ON pt.created_by = created_by_user.id
  LEFT JOIN users updated_by_user ON pt.updated_by = updated_by_user.id
  WHERE pt.id = $1
`;

// ─── Existence Check ──────────────────────────────────────────────────────────

// $1: pricing_type_id (UUID)
// Note: table is pricing_types not price_types — original had wrong table name.
const PRICING_TYPE_EXISTS_QUERY = `
  SELECT EXISTS (
    SELECT 1 FROM pricing_types WHERE id = $1
  ) AS exists
`;

// ─── Dropdown ─────────────────────────────────────────────────────────────────

// Fetches active pricing types with price label for a given product.
// NOTE: pricing table uses sku_id not product_id — this query joins through
// skus to reach the product. Verify join path matches your schema.
// $1: product_id (UUID)
const PRICING_TYPE_DROPDOWN_QUERY = `
  SELECT
    pt.id,
    CONCAT(pt.name, ' - $', p.price) AS label
  FROM pricing_types pt
  JOIN pricing  p    ON p.price_type_id  = pt.id
  JOIN skus     s    ON s.id             = p.sku_id
  JOIN products prod ON prod.id          = s.product_id
  JOIN status   st   ON pt.status_id     = st.id
  WHERE st.name = 'active'
    AND prod.id = $1
  ORDER BY pt.name ASC
`;

module.exports = {
  PRICING_TYPE_TABLE,
  PRICING_TYPE_JOINS,
  PRICING_TYPE_SORT_WHITELIST,
  buildPricingTypePaginatedQuery,
  PRICING_TYPE_GET_BY_ID_QUERY,
  PRICING_TYPE_EXISTS_QUERY,
  PRICING_TYPE_DROPDOWN_QUERY,
};
