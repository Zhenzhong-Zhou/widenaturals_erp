/**
 * @file lot-adjustment-type-queries.js
 * @description SQL query constants and factory functions for
 * lot-adjustment-type-repository.js.
 *
 * Exports:
 *  - LOT_ADJUSTMENT_TYPE_TABLE          — aliased table name passed to paginateQueryByOffset
 *  - LOT_ADJUSTMENT_TYPE_JOINS          — join clauses for the inventory_action_types parent
 *  - LOT_ADJUSTMENT_TYPE_SORT_WHITELIST — valid sort fields for lookup query
 *  - buildLotAdjustmentTypeLookupQuery  — factory for lookup query with dynamic WHERE
 */

'use strict';

const LOT_ADJUSTMENT_TYPE_TABLE = 'lot_adjustment_types lat';

// Exported separately so paginateQueryByOffset can include the join in
// auto-generated COUNT queries (the filter references iat.category).
const LOT_ADJUSTMENT_TYPE_JOINS = [
  'INNER JOIN inventory_action_types iat ON lat.inventory_action_type_id = iat.id',
];

const LOT_ADJUSTMENT_TYPE_SORT_WHITELIST = new Set([
  'lat.name',
  'lat.code',
  'lat.created_at',
]);

/**
 * Builds the lot adjustment type lookup query with a caller-supplied WHERE clause.
 *
 * The join to `inventory_action_types iat` lives in LOT_ADJUSTMENT_TYPE_JOINS
 * and is embedded into the SELECT here so the projection and the pagination
 * helper's COUNT both see the same source.
 *
 * @param {string} whereClause - Parameterised WHERE predicate from buildLotAdjustmentTypeFilter.
 * @returns {string}
 */
const buildLotAdjustmentTypeLookupQuery = (whereClause) => `
  SELECT
    lat.id,
    lat.name,
    lat.code,
    lat.is_active,
    iat.id    AS inventory_action_type_id,
    iat.name  AS inventory_action_type_name,
    iat.category
  FROM ${LOT_ADJUSTMENT_TYPE_TABLE}
  ${LOT_ADJUSTMENT_TYPE_JOINS.join('\n  ')}
  WHERE ${whereClause}
`;

module.exports = {
  LOT_ADJUSTMENT_TYPE_TABLE,
  LOT_ADJUSTMENT_TYPE_JOINS,
  LOT_ADJUSTMENT_TYPE_SORT_WHITELIST,
  buildLotAdjustmentTypeLookupQuery,
};
