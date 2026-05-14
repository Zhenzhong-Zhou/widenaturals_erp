/**
 * @file inventory-action-type-queries.js
 * @description SQL query constants and factory functions for
 * inventory-action-type-repository.js.
 *
 * Exports:
 *  - INVENTORY_ACTION_TYPE_TABLE          — aliased table name passed to paginateQueryByOffset
 *  - INVENTORY_ACTION_TYPE_SORT_WHITELIST — valid sort fields for lookup query
 *  - buildInventoryActionTypeLookupQuery  — factory for lookup query with dynamic WHERE
 */

'use strict';

const INVENTORY_ACTION_TYPE_TABLE = 'inventory_action_types iat';

const INVENTORY_ACTION_TYPE_SORT_WHITELIST = new Set([
  'iat.name',
  'iat.category',
  'iat.created_at',
]);

/**
 * Builds the inventory action type lookup query with a caller-supplied WHERE clause.
 *
 * @param {string} whereClause - Parameterised WHERE predicate from buildInventoryActionTypeFilter.
 * @returns {string}
 */
const buildInventoryActionTypeLookupQuery = (whereClause) => `
  SELECT
    iat.id,
    iat.name,
    iat.category,
    iat.status_id,
    iat.is_adjustment,
    iat.affects_financials,
    iat.requires_audit,
    iat.default_action
  FROM ${INVENTORY_ACTION_TYPE_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  INVENTORY_ACTION_TYPE_TABLE,
  INVENTORY_ACTION_TYPE_SORT_WHITELIST,
  buildInventoryActionTypeLookupQuery,
};
