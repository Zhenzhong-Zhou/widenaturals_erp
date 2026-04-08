/**
 * @file supplier-repository.js
 * @description Database access layer for supplier records.
 *
 * Exports:
 *  - getSupplierLookup — offset-paginated dropdown lookup with optional filtering
 */

'use strict';

const { buildSupplierFilter } = require('../utils/sql/build-supplier-filter');
const { buildVendorLookup } = require('./utils/build-vendor-lookup');
const {
  SUPPLIER_TABLE,
  SUPPLIER_SORT_WHITELIST,
  SUPPLIER_ADDITIONAL_SORTS,
  buildSupplierLookupQuery,
} = require('./queries/supplier-queries');

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated supplier records for dropdown/lookup use.
 *
 * Status and location joins are conditional on capability flags —
 * only included when keyword search needs to match against those fields.
 *
 * @param {Object}  params
 * @param {Object}  [params.filters={}]                      - Optional filters.
 * @param {Object}  [params.options={}]                      - Capability flags.
 * @param {number}  [params.limit=50]                        - Max records per page.
 * @param {number}  [params.offset=0]                        - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getSupplierLookup = async ({
                                   filters = {},
                                   options = {},
                                   limit   = 50,
                                   offset  = 0,
                                 }) => {
  const context = 'supplier-repository/getSupplierLookup';
  const { canSearchStatus = false, canSearchLocation = false } = options;
  
  const joins = [
    ...(canSearchStatus   ? ['LEFT JOIN status st   ON st.id = s.status_id']  : []),
    ...(canSearchLocation ? ['LEFT JOIN locations l  ON l.id = s.location_id'] : []),
  ];
  
  const { whereClause, params } = buildSupplierFilter(filters, {
    canSearchStatus,
    canSearchLocation,
  });
  
  const queryText = buildSupplierLookupQuery(joins, whereClause);
  
  return buildVendorLookup({
    context,
    tableName:       SUPPLIER_TABLE,
    joins,
    whereClause,
    queryParams:     params,
    queryText,
    sortBy:          's.name',
    sortWhitelist:   SUPPLIER_SORT_WHITELIST,
    additionalSorts: SUPPLIER_ADDITIONAL_SORTS,
    limit,
    offset,
    filters,
  });
};

module.exports = {
  getSupplierLookup,
};
