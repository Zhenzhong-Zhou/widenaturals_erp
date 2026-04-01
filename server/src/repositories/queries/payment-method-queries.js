/**
 * @file payment-method-queries.js
 * @description SQL query constants and factory functions for
 * payment-method-repository.js.
 *
 * Exports:
 *  - PAYMENT_METHOD_TABLE           — aliased table name for lookup query
 *  - PAYMENT_METHOD_SORT_WHITELIST  — valid sort fields for lookup query
 *  - PAYMENT_METHOD_ADDITIONAL_SORTS — tie-break sort columns for lookup
 *  - buildPaymentMethodLookupQuery  — factory for lookup query
 */

'use strict';

const PAYMENT_METHOD_TABLE = 'payment_methods pm';

const PAYMENT_METHOD_SORT_WHITELIST = new Set([
  'pm.display_order',
  'pm.name',
  'pm.id',
]);

// Primary sort is display_order — name is the tie-breaker only.
const PAYMENT_METHOD_ADDITIONAL_SORTS = [
  { column: 'pm.name', direction: 'ASC' },
];

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildPaymentMethodFilter.
 * @returns {string}
 */
const buildPaymentMethodLookupQuery = (whereClause) => `
  SELECT
    pm.id,
    pm.name,
    pm.is_active
  FROM ${PAYMENT_METHOD_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  PAYMENT_METHOD_TABLE,
  PAYMENT_METHOD_SORT_WHITELIST,
  PAYMENT_METHOD_ADDITIONAL_SORTS,
  buildPaymentMethodLookupQuery,
};
