/**
 * @file order-type-queries.js
 * @description SQL query constants and factory functions for order-type-repository.js.
 *
 * Exports:
 *  - ORDER_TYPE_TABLE                  — aliased table name for paginated query
 *  - ORDER_TYPE_JOINS                  — join array for paginated query
 *  - ORDER_TYPE_PAGINATED_SORT_WHITELIST — valid sort fields for paginated query
 *  - buildOrderTypePaginatedQuery      — factory for paginated list query
 *  - ORDER_TYPE_LOOKUP_TABLE           — aliased table name for lookup query
 *  - ORDER_TYPE_LOOKUP_SORT_WHITELIST  — valid sort fields for lookup query
 *  - buildOrderTypeLookupQuery         — factory for lookup query
 *  - ORDER_TYPE_META_BY_ORDER_QUERY    — fetch order type metadata by order id
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Paginated List ───────────────────────────────────────────────────────────

const ORDER_TYPE_TABLE = 'order_types ot';

const ORDER_TYPE_JOINS = [
  'INNER JOIN status s ON ot.status_id  = s.id',
  'LEFT JOIN  users u1 ON ot.created_by = u1.id',
  'LEFT JOIN  users u2 ON ot.updated_by = u2.id',
];

const _ORDER_TYPE_JOINS_SQL = ORDER_TYPE_JOINS.join('\n  ');

const ORDER_TYPE_PAGINATED_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.orderTypeSortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildOrderTypeFilter.
 * @returns {string}
 */
const buildOrderTypePaginatedQuery = (whereClause) => `
  SELECT
    ot.id,
    ot.name,
    ot.code,
    ot.category,
    ot.requires_payment,
    ot.status_id,
    s.name                        AS status_name,
    ot.status_date,
    ot.created_at,
    ot.updated_at,
    u1.firstname                  AS created_by_firstname,
    u1.lastname                   AS created_by_lastname,
    u2.firstname                  AS updated_by_firstname,
    u2.lastname                   AS updated_by_lastname
  FROM ${ORDER_TYPE_TABLE}
  ${_ORDER_TYPE_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Lookup Query ─────────────────────────────────────────────────────────────

const ORDER_TYPE_LOOKUP_TABLE = 'order_types ot';

const ORDER_TYPE_LOOKUP_SORT_WHITELIST = new Set(['ot.name', 'ot.id']);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildOrderTypeFilter.
 * @returns {string}
 */
const buildOrderTypeLookupQuery = (whereClause) => `
  SELECT
    ot.id,
    ot.name,
    ot.category,
    ot.requires_payment,
    ot.status_id
  FROM ${ORDER_TYPE_LOOKUP_TABLE}
  WHERE ${whereClause}
`;

// ─── Meta By Order ────────────────────────────────────────────────────────────

// Lightweight fetch for order type metadata via order id.
// $1: order_id (UUID)
const ORDER_TYPE_META_BY_ORDER_QUERY = `
  SELECT
    o.id                          AS order_id,
    o.order_number,
    ot.code                       AS order_type_code,
    ot.name                       AS order_type_name,
    ot.category                   AS order_type_category
  FROM orders o
  JOIN order_types ot ON o.order_type_id = ot.id
  WHERE o.id = $1
`;

module.exports = {
  ORDER_TYPE_TABLE,
  ORDER_TYPE_JOINS,
  ORDER_TYPE_PAGINATED_SORT_WHITELIST,
  buildOrderTypePaginatedQuery,
  ORDER_TYPE_LOOKUP_TABLE,
  ORDER_TYPE_LOOKUP_SORT_WHITELIST,
  buildOrderTypeLookupQuery,
  ORDER_TYPE_META_BY_ORDER_QUERY,
};
