/**
 * @file warehouse-type-queries.js
 * @description SQL query constants and factory functions for warehouse-type-repository.js.
 *
 * Exports:
 *  - WAREHOUSE_TYPE_LOOKUP_TABLE             — aliased table name for lookup query
 *  - WAREHOUSE_TYPE_LOOKUP_JOINS             — join array for lookup query
 *  - WAREHOUSE_TYPE_LOOKUP_SORT_WHITELIST    — valid sort columns for lookup query
 *  - WAREHOUSE_TYPE_LOOKUP_ADDITIONAL_SORTS  — tiebreaker sorts for lookup query
 *  - buildWarehouseTypeLookupQuery           — factory for lookup query
 */

'use strict';

// ─── Lookup ───────────────────────────────────────────────────────────────────

const WAREHOUSE_TYPE_LOOKUP_TABLE = 'warehouse_types wt';

const WAREHOUSE_TYPE_LOOKUP_JOINS = [];

const WAREHOUSE_TYPE_LOOKUP_SORT_WHITELIST = new Set(['wt.name', 'wt.id']);

const WAREHOUSE_TYPE_LOOKUP_ADDITIONAL_SORTS = [
  { column: 'wt.id', direction: 'ASC' },
];

/**
 * @param {string} whereClause
 * @returns {string}
 */
const buildWarehouseTypeLookupQuery = (whereClause) => `
  SELECT
    wt.id,
    wt.name,
    wt.is_active
  FROM ${WAREHOUSE_TYPE_LOOKUP_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  WAREHOUSE_TYPE_LOOKUP_TABLE,
  WAREHOUSE_TYPE_LOOKUP_JOINS,
  WAREHOUSE_TYPE_LOOKUP_SORT_WHITELIST,
  WAREHOUSE_TYPE_LOOKUP_ADDITIONAL_SORTS,
  buildWarehouseTypeLookupQuery,
};
