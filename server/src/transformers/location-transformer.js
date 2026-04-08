/**
 * @file location-transformer.js
 * @description Row-level and page-level transformers for location records.
 *
 * Exports:
 *   - transformLocationRow               – transforms a single location DB row
 *   - transformPaginatedLocationResults  – transforms a paginated location result set
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { cleanObject }             = require('../utils/object-utils');
const { transformPageResult }     = require('../utils/transformer-utils');

/**
 * Transforms a single location DB row into the UI-facing shape.
 *
 * @param {LocationRow} row
 * @returns {LocationRecord}
 */
const transformLocationRow = (row) =>
  cleanObject({
    id:           row.id,
    name:         row.name,
    locationType: row.location_type_name ?? null,
    address: {
      city:            row.city             ?? null,
      provinceOrState: row.province_or_state ?? null,
      country:         row.country           ?? null,
    },
    isArchived: row.is_archived ?? false,
    status: {
      id:   row.status_id   ?? null,
      name: row.status_name ?? null,
      date: row.status_date ?? null,
    },
    audit: compactAudit(makeAudit(row)),
  });

/**
 * Transforms a paginated location result set into the UI-facing shape.
 *
 * Delegates per-row transformation to `transformLocationRow` via `transformPageResult`,
 * which preserves pagination metadata.
 *
 * @param {Object}        paginatedResult
 * @param {LocationRow[]} paginatedResult.data
 * @param {Object}        paginatedResult.pagination
 * @returns {Promise<PaginatedResult<LocationRow>>}
 */
const transformPaginatedLocationResults = (paginatedResult) =>
  /** @type {Promise<PaginatedResult<LocationRow>>} */
  (transformPageResult(paginatedResult, transformLocationRow));

module.exports = {
  transformLocationRow,
  transformPaginatedLocationResults,
};
