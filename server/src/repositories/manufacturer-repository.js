/**
 * @file manufacturer-repository.js
 * @description Database access layer for manufacturer records.
 *
 * Exports:
 *  - getManufacturerLookup — offset-paginated dropdown lookup with optional filtering
 */

'use strict';

const {
  buildManufacturerFilter,
} = require('../utils/sql/build-manufacturer-filter');
const { buildVendorLookup } = require('./utils/build-vendor-lookup');
const {
  MANUFACTURER_TABLE,
  MANUFACTURER_SORT_WHITELIST,
  MANUFACTURER_ADDITIONAL_SORTS,
  buildManufacturerLookupQuery,
} = require('./queries/manufacturer-queries');

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Fetches paginated manufacturer records for dropdown/lookup use.
 *
 * Status and location joins are conditional on capability flags —
 * only included when keyword search needs to match against those fields.
 *
 * @param {Object}  params
 * @param {Object}  [params.filters={}]                    - Optional filters.
 * @param {Object}  [params.options={}]                    - Capability flags.
 * @param {number}  [params.limit=50]                      - Max records per page.
 * @param {number}  [params.offset=0]                      - Offset for pagination.
 *
 * @returns {Promise<Object>} Paginated result with rows and pagination metadata.
 * @throws  {AppError}        Normalized database error if the query fails.
 */
const getManufacturerLookup = async ({
  filters = {},
  options = {},
  limit = 50,
  offset = 0,
}) => {
  const context = 'manufacturer-repository/getManufacturerLookup';
  const { canSearchStatus = false, canSearchLocation = false } = options;

  const joins = [
    ...(canSearchStatus ? ['LEFT JOIN status s    ON s.id = m.status_id'] : []),
    ...(canSearchLocation
      ? ['LEFT JOIN locations l ON l.id = m.location_id']
      : []),
  ];

  const { whereClause, params } = buildManufacturerFilter(filters, {
    canSearchStatus,
    canSearchLocation,
  });

  const queryText = buildManufacturerLookupQuery(joins, whereClause);

  return buildVendorLookup({
    context,
    tableName: MANUFACTURER_TABLE,
    joins,
    whereClause,
    queryParams: params,
    queryText,
    sortBy: 'm.name',
    sortWhitelist: MANUFACTURER_SORT_WHITELIST,
    additionalSorts: MANUFACTURER_ADDITIONAL_SORTS,
    limit,
    offset,
    filters,
  });
};

module.exports = {
  getManufacturerLookup,
};
