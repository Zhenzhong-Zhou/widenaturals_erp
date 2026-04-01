/**
 * @file build-supplier-filter.js
 * @description SQL WHERE clause builder for supplier queries.
 *
 * Thin wrapper over buildVendorFilter — supplier uses alias 's'
 * and status join alias 'st' to avoid collision with the main table alias.
 *
 * Exports:
 *  - buildSupplierFilter
 */

'use strict';

const { buildVendorFilter } = require('./build-vendor-filter');

/**
 * @param {Object} [filters={}] - See buildVendorFilter for full param docs.
 * @param {Object} [options={}] - See buildVendorFilter for full options docs.
 * @returns {{ whereClause: string, params: Array }}
 */
const buildSupplierFilter = (filters = {}, options = {}) =>
  buildVendorFilter('s', filters, { statusAlias: 'st', ...options });

module.exports = {
  buildSupplierFilter,
};
