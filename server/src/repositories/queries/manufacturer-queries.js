/**
 * @file manufacturer-queries.js
 * @description SQL query constants for manufacturer-repository.js.
 *
 * Exports:
 *  - MANUFACTURER_TABLE           — aliased table name
 *  - MANUFACTURER_SORT_WHITELIST  — valid sort fields
 *  - MANUFACTURER_ADDITIONAL_SORTS — tie-break sort columns
 *  - buildManufacturerLookupQuery — factory for lookup query
 */

'use strict';

const MANUFACTURER_TABLE = 'manufacturers m';

const MANUFACTURER_SORT_WHITELIST = new Set([
  'm.name',
  'm.code',
  'm.id',
]);

const MANUFACTURER_ADDITIONAL_SORTS = [
  { column: 'm.code', direction: 'ASC' },
];

/**
 * @param {string[]} joins       - Conditional join clauses from the caller.
 * @param {string}   whereClause - Parameterised WHERE predicate.
 * @returns {string}
 */
const buildManufacturerLookupQuery = (joins, whereClause) => `
  SELECT
    m.id,
    m.name,
    m.contact_name,
    m.status_id
  FROM ${MANUFACTURER_TABLE}
  ${joins.join('\n  ')}
  WHERE ${whereClause}
`;

module.exports = {
  MANUFACTURER_TABLE,
  MANUFACTURER_SORT_WHITELIST,
  MANUFACTURER_ADDITIONAL_SORTS,
  buildManufacturerLookupQuery,
};
