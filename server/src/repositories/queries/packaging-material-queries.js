/**
 * @file packaging-material-queries.js
 * @description SQL query constants and factory functions for
 * packaging-material-repository.js.
 *
 * Exports:
 *  - PM_TABLE                  — aliased table name for lookup query
 *  - PM_SORT_WHITELIST         — valid sort fields for lookup query
 *  - buildPmLookupQuery        — factory for sales order lookup query
 */

'use strict';

const PM_TABLE = 'packaging_materials pm';

const PM_SORT_WHITELIST = new Set(['pm.name']);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildPackagingMaterialsFilter.
 * @returns {string}
 */
const buildPmLookupQuery = (whereClause) => `
  SELECT
    pm.id,
    pm.name,
    pm.size,
    pm.color,
    pm.unit,
    pm.status_id,
    pm.is_archived
  FROM ${PM_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  PM_TABLE,
  PM_SORT_WHITELIST,
  buildPmLookupQuery,
};
