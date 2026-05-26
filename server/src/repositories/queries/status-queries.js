/**
 * @file status-queries.js
 * @description SQL query constants and factory functions for status-repository.js.
 *
 * All constants are built once at module load.
 * Factory functions accept a pre-built WHERE clause from the filter builder.
 *
 * Exports:
 *  - STATUS_TABLE                      — aliased table name passed to paginateQuery
 *  - STATUS_SORT_WHITELIST             — valid sort fields for paginated list query
 *  - STATUS_LOOKUP_SORT_WHITELIST      — valid sort fields for lookup query
 *  - STATUS_LOOKUP_ADDITIONAL_SORTS    — deterministic tie-break sort columns
 *  - CHECK_STATUS_EXISTS_QUERY         — existence check by id
 *  - GET_ALL_STATUSES_QUERY            — full unfiltered status list ordered by name
 *  - GET_ALL_DOMAIN_STATUS_CODES_QUERY — union of all per-domain status code tables
 *  - buildStatusPaginatedQuery         — factory for paginated list query
 *  - buildStatusLookupQuery            — factory for dropdown lookup query
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Table ────────────────────────────────────────────────────────────────────

const STATUS_TABLE = 'status s';

// ─── Sort ─────────────────────────────────────────────────────────────────────

const STATUS_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.statusSortMap)
);

const STATUS_LOOKUP_SORT_WHITELIST = new Set(['s.name', 's.created_at']);

const STATUS_LOOKUP_ADDITIONAL_SORTS = [
  { column: 's.created_at', direction: 'ASC' },
];

// ─── Scalar Lookups ───────────────────────────────────────────────────────────

// $1: status id (UUID)
const CHECK_STATUS_EXISTS_QUERY = `
  SELECT EXISTS (
    SELECT 1
    FROM status
    WHERE id = $1
  ) AS exists
`;

const GET_ALL_STATUSES_QUERY = `
  SELECT
    id,
    name,
    is_active
  FROM status
  ORDER BY name ASC
`;

const GET_ALL_DOMAIN_STATUS_CODES_QUERY = `
  SELECT id, code, name, 'order_status'                AS source_table FROM order_status
  UNION ALL
  SELECT id, code, name, 'shipment_status'             AS source_table FROM shipment_status
  UNION ALL
  SELECT id, code, name, 'fulfillment_status'          AS source_table FROM fulfillment_status
  UNION ALL
  SELECT id, code, name, 'inventory_allocation_status' AS source_table FROM inventory_allocation_status
  UNION ALL
  SELECT id, code, name, 'inventory_transfer_status'   AS source_table FROM inventory_transfer_status
  UNION ALL
  SELECT id, code, name, 'payment_status'              AS source_table FROM payment_status
  UNION ALL
  SELECT id, code, name, 'transfer_order_item_status'  AS source_table FROM transfer_order_item_status
  ORDER BY source_table, name
`;

// ─── Paginated List ───────────────────────────────────────────────────────────

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildStatusFilter.
 * @returns {string}
 */
const buildStatusPaginatedQuery = (whereClause) => `
  SELECT
    s.id,
    s.name,
    s.description,
    s.is_active,
    s.created_at,
    s.updated_at
  FROM ${STATUS_TABLE}
  WHERE ${whereClause}
`;

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildStatusFilter.
 * @returns {string}
 */
const buildStatusLookupQuery = (whereClause) => `
  SELECT
    s.id,
    s.name,
    s.is_active
  FROM ${STATUS_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  STATUS_TABLE,
  STATUS_SORT_WHITELIST,
  STATUS_LOOKUP_SORT_WHITELIST,
  STATUS_LOOKUP_ADDITIONAL_SORTS,
  CHECK_STATUS_EXISTS_QUERY,
  GET_ALL_STATUSES_QUERY,
  GET_ALL_DOMAIN_STATUS_CODES_QUERY,
  buildStatusPaginatedQuery,
  buildStatusLookupQuery,
};
