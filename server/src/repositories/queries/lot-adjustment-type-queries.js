/**
 * @file lot-adjustment-type-queries.js
 * @description SQL query constants and factory functions for
 * lot-adjustment-type-repository.js.
 *
 * Exports:
 *  - buildLotAdjustmentTypeLookupQuery — factory for lookup query with dynamic WHERE
 */

'use strict';

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildLotAdjustmentWhereClause.
 * @returns {string}
 */
const buildLotAdjustmentTypeLookupQuery = (whereClause) => `
  SELECT
    lat.id  AS lot_adjustment_type_id,
    iat.id  AS inventory_action_type_id,
    lat.name
  FROM lot_adjustment_types lat
  JOIN inventory_action_types iat ON lat.inventory_action_type_id = iat.id
  WHERE ${whereClause}
  ORDER BY lat.name ASC
`;

module.exports = {
  buildLotAdjustmentTypeLookupQuery,
};
