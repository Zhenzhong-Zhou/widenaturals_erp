/**
 * @file tax-rate-queries.js
 * @description SQL query constants and factory functions for tax-rate-repository.js.
 *
 * All constants are built once at module load.
 * Factory functions accept a pre-built WHERE clause from the filter builder.
 *
 * Exports:
 *  - TAX_RATE_TABLE                  — aliased table name passed to paginateQueryByOffset
 *  - TAX_RATE_LOOKUP_SORT_WHITELIST  — valid sort fields for lookup query
 *  - buildTaxRateLookupQuery         — factory for lookup query
 */

'use strict';

// ─── Table ────────────────────────────────────────────────────────────────────

const TAX_RATE_TABLE = 'tax_rates tr';

// ─── Sort ─────────────────────────────────────────────────────────────────────

const TAX_RATE_LOOKUP_SORT_WHITELIST = new Set(['tr.name', 'tr.id']);

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * @param {string} whereClause - Parameterised WHERE predicate from buildTaxRateFilter.
 * @returns {string}
 */
const buildTaxRateLookupQuery = (whereClause) => `
  SELECT
    tr.id,
    tr.name,
    tr.region,
    tr.rate,
    tr.province,
    tr.is_active,
    tr.valid_from,
    tr.valid_to
  FROM ${TAX_RATE_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  TAX_RATE_TABLE,
  TAX_RATE_LOOKUP_SORT_WHITELIST,
  buildTaxRateLookupQuery,
};
