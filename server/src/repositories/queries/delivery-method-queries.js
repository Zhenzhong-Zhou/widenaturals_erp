/**
 * @file delivery-method-queries.js
 * @description SQL query constants and factory functions for
 * delivery-method-repository.js.
 *
 * Exports:
 *  - DELIVERY_METHOD_TABLE         — aliased table name passed to paginateQueryByOffset
 *  - DELIVERY_METHOD_SORT_WHITELIST — valid sort fields for lookup query
 *  - buildDeliveryMethodLookupQuery — factory for lookup query with dynamic WHERE
 */

'use strict';

const DELIVERY_METHOD_TABLE = 'delivery_methods dm';

// Only method_name is sortable — lookup is a narrow projection for dropdowns.
const DELIVERY_METHOD_SORT_WHITELIST = new Set(['dm.method_name']);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildDeliveryMethodFilter.
 * @returns {string}
 */
const buildDeliveryMethodLookupQuery = (whereClause) => `
  SELECT
    dm.id,
    dm.method_name        AS name,
    dm.is_pickup_location,
    dm.status_id
  FROM ${DELIVERY_METHOD_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  DELIVERY_METHOD_TABLE,
  DELIVERY_METHOD_SORT_WHITELIST,
  buildDeliveryMethodLookupQuery,
};
