/**
 * @file supplier-queries.js
 * @description SQL query constants for supplier-repository.js.
 *
 * Exports:
 *  - SUPPLIER_TABLE           — aliased table name
 *  - SUPPLIER_SORT_WHITELIST  — valid sort fields
 *  - SUPPLIER_ADDITIONAL_SORTS — tie-break sort columns
 *  - buildSupplierLookupQuery — factory for lookup query
 */

'use strict';

const SUPPLIER_TABLE = 'suppliers s';

const SUPPLIER_SORT_WHITELIST = new Set(['s.name', 's.code', 's.id']);

const SUPPLIER_ADDITIONAL_SORTS = [{ column: 's.code', direction: 'ASC' }];

/**
 * @param {string[]} joins       - Conditional join clauses from the caller.
 * @param {string}   whereClause - Parameterised WHERE predicate.
 * @returns {string}
 */
const buildSupplierLookupQuery = (joins, whereClause) => `
  SELECT
    s.id,
    s.name,
    s.contact_name,
    s.status_id
  FROM ${SUPPLIER_TABLE}
  ${joins.join('\n  ')}
  WHERE ${whereClause}
`;

module.exports = {
  SUPPLIER_TABLE,
  SUPPLIER_SORT_WHITELIST,
  SUPPLIER_ADDITIONAL_SORTS,
  buildSupplierLookupQuery,
};
