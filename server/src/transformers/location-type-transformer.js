/**
 * @file location-type-transformer.js
 * @description Row-level and page-level transformers for location type records.
 *
 * Exports:
 *   - transformLocationTypeDetail           – transforms a single location type row (detail view)
 *   - transformPaginatedLocationTypeResults – transforms a paginated location type result set
 *
 * Internal helpers (not exported):
 *   - transformLocationTypeRow – per-row transformer; shared by both exported functions
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { cleanObject }             = require('../utils/object-utils');
const { transformPageResult }     = require('../utils/transformer-utils');

/**
 * Transforms a single location type DB row into the UI-facing shape.
 *
 * Used by both the paginated transformer and the detail transformer —
 * the output shape is identical for table and detail views.
 *
 * @param {LocationTypeRow} row
 * @returns {LocationTypeRecord}
 */
const transformLocationTypeRow = (row) =>
  cleanObject({
    id:          row.id,
    code:        row.code,
    name:        row.name,
    description: row.description ?? null,
    status: {
      id:   row.status_id   ?? null,
      name: row.status_name ?? null,
      date: row.status_date ?? null,
    },
    audit: compactAudit(makeAudit(row)),
  });

/**
 * Transforms a paginated location type result set into the UI-facing shape.
 *
 * Delegates per-row transformation to `transformLocationTypeRow` via
 * `transformPageResult`, which preserves pagination metadata.
 *
 * @param {Object}            paginatedResult
 * @param {LocationTypeRow[]} paginatedResult.data
 * @param {Object}            paginatedResult.pagination
 * @returns {Promise<PaginatedResult<LocationTypeRow>>}
 */
const transformPaginatedLocationTypeResults = (paginatedResult) =>
  /** @type {Promise<PaginatedResult<LocationTypeRow>>} */
  (transformPageResult(paginatedResult, transformLocationTypeRow));

/**
 * Transforms a single location type DB row into the detail view shape.
 *
 * Delegates to `transformLocationTypeRow` — the output shape is identical
 * to the paginated row shape.
 *
 * @param {LocationTypeRow} row
 * @returns {LocationTypeRecord}
 */
const transformLocationTypeDetail = (row) => transformLocationTypeRow(row);

module.exports = {
  transformPaginatedLocationTypeResults,
  transformLocationTypeDetail,
};
