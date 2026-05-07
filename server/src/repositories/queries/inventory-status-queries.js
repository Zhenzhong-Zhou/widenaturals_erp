/**
 * @file inventory-status-queries.js
 * @description SQL query constants and factory functions for inventory_status access.
 *
 * Exports:
 *  - VALIDATE_INVENTORY_STATUS_IDS_QUERY      — existence check for a set of status IDs
 *  - GET_INVENTORY_STATUS_BY_ID_QUERY         — single-row existence/identity check by ID
 *  - INVENTORY_STATUS_LOOKUP_TABLE            — aliased table name for lookup query
 *  - INVENTORY_STATUS_LOOKUP_JOINS            — join array for lookup query (empty)
 *  - INVENTORY_STATUS_LOOKUP_SORT_WHITELIST   — valid sort keys for lookup query
 *  - INVENTORY_STATUS_LOOKUP_ADDITIONAL_SORTS — tie-break sorts for lookup query
 *  - buildInventoryStatusLookupQuery          — factory for dropdown/lookup query
 */

'use strict';

// ─── Validation ───────────────────────────────────────────────────────────────

const VALIDATE_INVENTORY_STATUS_IDS_QUERY = `
  SELECT id
  FROM inventory_status
  WHERE id = ANY($1::uuid[])
`;

const GET_INVENTORY_STATUS_BY_ID_QUERY = `
  SELECT id
  FROM inventory_status
  WHERE id = $1
`;

// ─── Lookup ───────────────────────────────────────────────────────────────────

const INVENTORY_STATUS_LOOKUP_TABLE = 'inventory_status ist';

const INVENTORY_STATUS_LOOKUP_JOINS = [];

const INVENTORY_STATUS_LOOKUP_SORT_WHITELIST = new Set(['ist.name', 'ist.id']);

const INVENTORY_STATUS_LOOKUP_ADDITIONAL_SORTS = [
  { column: 'ist.id', direction: 'ASC' },
];

/**
 * @param {string} whereClause
 * @returns {string}
 */
const buildInventoryStatusLookupQuery = (whereClause) => `
  SELECT
    ist.id,
    ist.name,
    ist.is_active
  FROM ${INVENTORY_STATUS_LOOKUP_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  VALIDATE_INVENTORY_STATUS_IDS_QUERY,
  GET_INVENTORY_STATUS_BY_ID_QUERY,
  INVENTORY_STATUS_LOOKUP_TABLE,
  INVENTORY_STATUS_LOOKUP_JOINS,
  INVENTORY_STATUS_LOOKUP_SORT_WHITELIST,
  INVENTORY_STATUS_LOOKUP_ADDITIONAL_SORTS,
  buildInventoryStatusLookupQuery,
};
