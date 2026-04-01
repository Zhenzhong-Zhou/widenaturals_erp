/**
 * @file status-queries.js
 * @description SQL query constants and factory functions for status-repository.js.
 *
 * All constants are built once at module load.
 * Factory functions accept a pre-built WHERE clause from the filter builder.
 *
 * Exports:
 *  - STATUS_TABLE              — aliased table name passed to paginateQuery
 *  - STATUS_SORT_WHITELIST     — valid sort fields for paginated list query
 *  - STATUS_LOOKUP_SORT_WHITELIST — valid sort fields for lookup query
 *  - STATUS_LOOKUP_ADDITIONAL_SORTS — deterministic tie-break sort columns
 *  - CHECK_STATUS_EXISTS_QUERY — existence check by id
 *  - GET_ALL_STATUSES_QUERY    — full unfiltered status list ordered by name
 *  - buildStatusPaginatedQuery — factory for paginated list query
 *  - buildStatusLookupQuery    — factory for dropdown lookup query
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
  buildStatusPaginatedQuery,
  buildStatusLookupQuery,
};
