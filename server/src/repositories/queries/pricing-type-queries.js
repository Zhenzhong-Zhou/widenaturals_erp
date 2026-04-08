/**
 * @file pricing-type-queries.js
 * @description SQL query constants and factory functions for pricing-type-repository.js.
 *
 * Exports:
 *  - PRICING_TYPE_TABLE             — aliased table name for paginated query
 *  - PRICING_TYPE_JOINS             — join array for paginated query
 *  - PRICING_TYPE_SORT_WHITELIST    — valid sort columns for paginated query
 *  - buildPricingTypePaginatedQuery — factory for paginated list query
 *  - PRICING_TYPE_GET_BY_ID_QUERY   — full detail fetch by id
 *  - PRICING_TYPE_EXISTS_QUERY      — existence check by id
 *  - PRICING_TYPE_DROPDOWN_QUERY    — dropdown fetch scoped to a product
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Paginated List ───────────────────────────────────────────────────────────

const PRICING_TYPE_TABLE = 'pricing_types pt';

const PRICING_TYPE_JOINS = [
  'JOIN      status st ON st.id = pt.status_id',
  'LEFT JOIN users  cu ON cu.id = pt.created_by',
  'LEFT JOIN users  uu ON uu.id = pt.updated_by',
];

const _PRICING_TYPE_JOINS_SQL = PRICING_TYPE_JOINS.join('\n  ');

const PRICING_TYPE_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.pricingTypeSortMap)
);

/**
 * Builds the paginated SELECT query for pricing types.
 *
 * Audit user fields returned as separate firstname/lastname columns —
 * concatenation is left to the transformer layer.
 *
 * @param {string} whereClause - Parameterised WHERE predicate from buildPricingTypeFilter.
 * @returns {string}
 */
const buildPricingTypePaginatedQuery = (whereClause) => `
  SELECT
    pt.id,
    pt.name,
    pt.code,
    pt.slug,
    pt.description,
    pt.status_id,
    st.name                       AS status_name,
    pt.status_date,
    pt.created_at,
    pt.updated_at,
    cu.firstname                  AS created_by_firstname,
    cu.lastname                   AS created_by_lastname,
    uu.firstname                  AS updated_by_firstname,
    uu.lastname                   AS updated_by_lastname
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
    st.name                       AS status_name,
    pt.status_date,
    pt.created_at                 AS pricing_type_created_at,
    pt.updated_at                 AS pricing_type_updated_at,
    cu.id                         AS created_by_id,
    cu.firstname                  AS created_by_firstname,
    cu.lastname                   AS created_by_lastname,
    uu.id                         AS updated_by_id,
    uu.firstname                  AS updated_by_firstname,
    uu.lastname                   AS updated_by_lastname
  FROM pricing_types pt
  LEFT JOIN status st ON st.id = pt.status_id
  LEFT JOIN users  cu ON cu.id = pt.created_by
  LEFT JOIN users  uu ON uu.id = pt.updated_by
  WHERE pt.id = $1
`;

module.exports = {
  PRICING_TYPE_TABLE,
  PRICING_TYPE_JOINS,
  PRICING_TYPE_SORT_WHITELIST,
  buildPricingTypePaginatedQuery,
  PRICING_TYPE_GET_BY_ID_QUERY,
};
