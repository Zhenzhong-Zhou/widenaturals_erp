/**
 * @file packaging-material-supplier-queries.js
 * @description SQL query constants and factory functions for
 * packaging-material-supplier-repository.js.
 *
 * Exports:
 *  - PMS_TABLE                — aliased table name for lookup query
 *  - PMS_JOINS                — join array for lookup query
 *  - PMS_SORT_WHITELIST       — valid sort fields for lookup query
 *  - buildPmsLookupQuery      — factory for lookup query
 */

'use strict';

const PMS_TABLE = 'packaging_material_suppliers pms';

const PMS_JOINS = [
  'JOIN      suppliers s  ON s.id  = pms.supplier_id',
  'LEFT JOIN status    st ON st.id = s.status_id',
];

const _PMS_JOINS_SQL = PMS_JOINS.join('\n  ');

const PMS_SORT_WHITELIST = new Set(['s.name', 's.id']);

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildPackagingMaterialSupplierFilter.
 * @returns {string}
 */
const buildPmsLookupQuery = (whereClause) => `
  SELECT
    pms.id,
    pms.is_preferred,
    s.name,
    s.contact_name,
    s.contact_email,
    s.is_archived,
    s.status_id
  FROM ${PMS_TABLE}
  ${_PMS_JOINS_SQL}
  WHERE ${whereClause}
`;

module.exports = {
  PMS_TABLE,
  PMS_JOINS,
  PMS_SORT_WHITELIST,
  buildPmsLookupQuery,
};
