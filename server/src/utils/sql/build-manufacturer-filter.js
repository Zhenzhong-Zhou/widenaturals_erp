/**
 * @file build-manufacturer-filter.js
 * @description SQL WHERE clause builder for manufacturer queries.
 *
 * Thin wrapper over buildVendorFilter — manufacturer uses alias 'm'
 * and status join alias 's'.
 *
 * Exports:
 *  - buildManufacturerFilter
 */

'use strict';

const { buildVendorFilter } = require('./build-vendor-filter');

/**
 * @param {Object} [filters={}] - See buildVendorFilter for full param docs.
 * @param {Object} [options={}] - See buildVendorFilter for full options docs.
 * @returns {{ whereClause: string, params: Array }}
 */
const buildManufacturerFilter = (filters = {}, options = {}) =>
  buildVendorFilter('m', filters, { statusAlias: 's', ...options });

module.exports = {
  buildManufacturerFilter,
};
