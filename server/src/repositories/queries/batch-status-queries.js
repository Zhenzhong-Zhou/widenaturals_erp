/**
 * @file batch-status-queries.js
 * @description SQL query constants and factory functions for
 * batch-status-repository.js.
 *
 * Exports:
 *  - BATCH_STATUS_TABLE          — aliased table name passed to paginateQueryByOffset
 *  - BATCH_STATUS_SORT_WHITELIST — valid sort fields for lookup query
 *  - buildBatchStatusLookupQuery — factory for lookup query with dynamic WHERE
 */

'use strict';

const BATCH_STATUS_TABLE = 'batch_status bs';

// Only name is sortable — lookup is a narrow projection for dropdowns.
const BATCH_STATUS_SORT_WHITELIST = new Set(['bs.name']);

/**
 * Builds the batch status lookup query with a caller-supplied WHERE clause.
 *
 * @param {string} whereClause - Parameterised WHERE predicate from buildBatchStatusFilter.
 * @returns {string}
 */
const buildBatchStatusLookupQuery = (whereClause) => `
  SELECT
    bs.id,
    bs.name,
    bs.description,
    bs.is_active
  FROM ${BATCH_STATUS_TABLE}
  WHERE ${whereClause}
`;

module.exports = {
  BATCH_STATUS_TABLE,
  BATCH_STATUS_SORT_WHITELIST,
  buildBatchStatusLookupQuery,
};
