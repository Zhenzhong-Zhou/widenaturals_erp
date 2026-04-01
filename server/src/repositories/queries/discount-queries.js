/**
 * @file discount-queries.js
 * @description SQL query constants and factory functions for discount-repository.js.
 *
 * Exports:
 *  - DISCOUNT_GET_BY_ID              — minimal fetch by id
 *  - DISCOUNT_LOOKUP_TABLE           — aliased table name passed to paginateQueryByOffset
 *  - DISCOUNT_LOOKUP_SORT_WHITELIST  — valid sort fields for lookup query
 *  - DISCOUNT_LOOKUP_ADDITIONAL_SORTS — tie-break sort columns for lookup
 *  - buildDiscountLookupQuery        — factory for lookup query with dynamic WHERE
 */

'use strict';

// Minimal projection — used for discount resolution during order processing.
// $1: discount_id (UUID)
const DISCOUNT_GET_BY_ID = `
  SELECT discount_type, discount_value
  FROM discounts
  WHERE id = $1
`;

const DISCOUNT_LOOKUP_TABLE = 'discounts d';

const DISCOUNT_LOOKUP_SORT_WHITELIST = new Set([
  'd.name',
  'd.valid_from',
  'd.id',
]);

// Tie-break by validity start date after primary name sort.
const DISCOUNT_LOOKUP_ADDITIONAL_SORTS = [
  { column: 'd.valid_from', direction: 'ASC' },
];

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildDiscountFilter.
 * @returns {string}
 */
const buildDiscountLookupQuery = (whereClause) => `
  SELECT
    d.id,
    d.name,
    d.status_id,
    d.valid_from,
    d.valid_to,
    d.discount_type,
    d.discount_value
  FROM ${DISCOUNT_LOOKUP_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  DISCOUNT_GET_BY_ID,
  DISCOUNT_LOOKUP_TABLE,
  DISCOUNT_LOOKUP_SORT_WHITELIST,
  DISCOUNT_LOOKUP_ADDITIONAL_SORTS,
  buildDiscountLookupQuery,
};
