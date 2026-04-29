/**
 * @file location-type-queries.js
 * @description SQL query constants and factory functions for location-type-repository.js.
 *
 * Exports:
 *  - LOCATION_TYPE_TABLE                  — aliased table name for paginated query
 *  - LOCATION_TYPE_JOINS                  — standard join array for paginated query
 *  - LOCATION_TYPE_PAGINATED_SORT_WHITELIST — valid sort fields for paginated query
 *  - buildLocationTypePaginatedQuery      — factory for paginated list query
 *  - LOCATION_TYPE_GET_BY_ID             — static fetch by id
 *  - LOCATION_TYPE_LOOKUP_TABLE          — aliased table name for lookup query
 *  - LOCATION_TYPE_LOOKUP_SORT_WHITELIST — valid sort fields for lookup query
 *  - LOCATION_TYPE_LOOKUP_ADDITIONAL_SORTS — tie-break sort columns for lookup
 *  - buildLocationTypeLookupQuery         — factory for lookup query with optional status join
 */

'use strict';

// ─── Paginated List ───────────────────────────────────────────────────────────

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');
const LOCATION_TYPE_TABLE = 'location_types lt';

const LOCATION_TYPE_JOINS = [
  'LEFT JOIN status s  ON lt.status_id  = s.id',
  'LEFT JOIN users u1  ON lt.created_by = u1.id',
  'LEFT JOIN users u2  ON lt.updated_by = u2.id',
];

const _LOCATION_TYPE_JOINS_SQL = LOCATION_TYPE_JOINS.join('\n  ');

const LOCATION_TYPE_PAGINATED_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.locationTypeSortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildLocationTypeFilter.
 * @returns {string}
 */
const buildLocationTypePaginatedQuery = (whereClause) => `
  SELECT
    lt.id,
    lt.code,
    lt.name,
    lt.description,
    lt.status_id,
    s.name                        AS status_name,
    lt.status_date,
    lt.created_at,
    lt.updated_at,
    lt.created_by,
    lt.updated_by,
    u1.firstname                  AS created_by_firstname,
    u1.lastname                   AS created_by_lastname,
    u2.firstname                  AS updated_by_firstname,
    u2.lastname                   AS updated_by_lastname
  FROM ${LOCATION_TYPE_TABLE}
  ${_LOCATION_TYPE_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Single Record ────────────────────────────────────────────────────────────

// Full detail fetch — $1: location_type id (UUID)
const LOCATION_TYPE_GET_BY_ID = `
  SELECT
    lt.id,
    lt.code,
    lt.name,
    lt.description,
    lt.status_id,
    s.name                        AS status_name,
    lt.status_date,
    lt.created_at,
    lt.updated_at,
    lt.created_by,
    lt.updated_by,
    u1.firstname                  AS created_by_firstname,
    u1.lastname                   AS created_by_lastname,
    u2.firstname                  AS updated_by_firstname,
    u2.lastname                   AS updated_by_lastname
  FROM location_types lt
  LEFT JOIN status s  ON lt.status_id  = s.id
  LEFT JOIN users u1  ON lt.created_by = u1.id
  LEFT JOIN users u2  ON lt.updated_by = u2.id
  WHERE lt.id = $1
  LIMIT 1
`;

// ─── Lookup Query ─────────────────────────────────────────────────────────────

const LOCATION_TYPE_LOOKUP_TABLE = 'location_types lt';

const LOCATION_TYPE_LOOKUP_SORT_WHITELIST = new Set([
  'lt.name',
  'lt.code',
  'lt.id',
]);

// Tie-break by code after primary name sort.
const LOCATION_TYPE_LOOKUP_ADDITIONAL_SORTS = [
  { column: 'lt.code', direction: 'ASC' },
];

/**
 * The status join is conditional — only included when canSearchStatus is true,
 * which allows keyword search to match against status names.
 *
 * @param {string}  whereClause     - Parameterised WHERE predicate from buildLocationTypeFilter.
 * @param {boolean} canSearchStatus - If true, includes LEFT JOIN status for keyword search.
 * @returns {{ queryText: string, joins: string[] }}
 */
const buildLocationTypeLookupQuery = (whereClause, canSearchStatus = false) => {
  const joins = canSearchStatus
    ? ['LEFT JOIN status s ON s.id = lt.status_id']
    : [];

  const queryText = `
    SELECT
      lt.id,
      lt.name,
      lt.status_id
    FROM ${LOCATION_TYPE_LOOKUP_TABLE}
    ${joins.join('\n  ')}
    WHERE ${whereClause}
  `;

  return { queryText, joins };
};

module.exports = {
  LOCATION_TYPE_TABLE,
  LOCATION_TYPE_JOINS,
  LOCATION_TYPE_PAGINATED_SORT_WHITELIST,
  buildLocationTypePaginatedQuery,
  LOCATION_TYPE_GET_BY_ID,
  LOCATION_TYPE_LOOKUP_TABLE,
  LOCATION_TYPE_LOOKUP_SORT_WHITELIST,
  LOCATION_TYPE_LOOKUP_ADDITIONAL_SORTS,
  buildLocationTypeLookupQuery,
};
