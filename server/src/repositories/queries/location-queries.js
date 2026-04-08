/**
 * @file location-queries.js
 * @description SQL query constants and factory functions for location-repository.js.
 *
 * Exports:
 *  - LOCATION_TABLE          — aliased table name passed to paginateQuery
 *  - LOCATION_JOINS          — join array for paginated query
 *  - LOCATION_SORT_WHITELIST — valid sort fields for paginated query
 *  - buildLocationQuery      — factory for paginated list query
 */

'use strict';

const { SORTABLE_FIELDS } = require('../../utils/sort-field-mapping');

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

module.exports = {
  LOCATION_TABLE,
  LOCATION_JOINS,
  LOCATION_SORT_WHITELIST,
  buildLocationQuery,
};
