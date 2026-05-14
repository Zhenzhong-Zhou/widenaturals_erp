/**
 * @file location-queries.js
 * @description SQL query constants and factory functions for location-repository.js.
 *
 * Exports:
 *  - LOCATION_TABLE                   — aliased table name for paginated query
 *  - LOCATION_JOINS                   — join array for paginated query
 *  - LOCATION_SORT_WHITELIST          — valid sort fields for paginated query
 *  - buildLocationQuery               — factory for paginated list query
 *  - LOCATION_LOOKUP_TABLE            — aliased table name for lookup query
 *  - LOCATION_LOOKUP_JOINS            — join array for lookup query
 *  - LOCATION_LOOKUP_SORT_WHITELIST   — valid sort columns for lookup query
 *  - LOCATION_LOOKUP_ADDITIONAL_SORTS — tiebreaker sorts for lookup query
 *  - buildLocationLookupQuery         — factory for lookup query
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

// ─── Paginated List ───────────────────────────────────────────────────────────

const LOCATION_TABLE = 'locations l';

const LOCATION_JOINS = [
  'LEFT JOIN status s          ON l.status_id        = s.id',
  'LEFT JOIN location_types lt ON l.location_type_id = lt.id',
  'LEFT JOIN users u1          ON l.created_by        = u1.id',
  'LEFT JOIN users u2          ON l.updated_by        = u2.id',
];

const _LOCATION_JOINS_SQL = LOCATION_JOINS.join('\n  ');

const LOCATION_SORT_WHITELIST = new Set(
  Object.values(SORTABLE_FIELDS.locationSortMap)
);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildLocationFilter.
 * @returns {string}
 */
const buildLocationQuery = (whereClause) => `
  SELECT
    l.id,
    l.name,
    lt.name                       AS location_type_name,
    l.city,
    l.province_or_state,
    l.country,
    l.is_archived,
    l.status_id,
    s.name                        AS status_name,
    l.status_date,
    l.created_at,
    l.updated_at,
    l.created_by,
    l.updated_by,
    u1.firstname                  AS created_by_firstname,
    u1.lastname                   AS created_by_lastname,
    u2.firstname                  AS updated_by_firstname,
    u2.lastname                   AS updated_by_lastname
  FROM ${LOCATION_TABLE}
  ${_LOCATION_JOINS_SQL}
  WHERE ${whereClause}
`;

// ─── Lookup ───────────────────────────────────────────────────────────────────

const LOCATION_LOOKUP_TABLE = 'locations l';

const LOCATION_LOOKUP_JOINS = [];

const LOCATION_LOOKUP_SORT_WHITELIST = new Set(['l.name', 'l.city', 'l.id']);

const LOCATION_LOOKUP_ADDITIONAL_SORTS = [{ column: 'l.id', direction: 'ASC' }];

/**
 * @param {string} whereClause
 * @returns {string}
 */
const buildLocationLookupQuery = (whereClause) => `
  SELECT
    l.id,
    l.name,
    l.city,
    l.country,
    l.is_archived,
    l.status_id
  FROM ${LOCATION_LOOKUP_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  LOCATION_TABLE,
  LOCATION_JOINS,
  LOCATION_SORT_WHITELIST,
  buildLocationQuery,
  LOCATION_LOOKUP_TABLE,
  LOCATION_LOOKUP_JOINS,
  LOCATION_LOOKUP_SORT_WHITELIST,
  LOCATION_LOOKUP_ADDITIONAL_SORTS,
  buildLocationLookupQuery,
};
