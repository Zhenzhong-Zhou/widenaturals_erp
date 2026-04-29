/**
 * @file order-type-transformer.js
 * @description Row-level and page-level transformers for order type records.
 *
 * Exports:
 *   - transformPaginatedOrderTypes – transforms a paginated order type result set
 *
 * Internal helpers (not exported):
 *   - transformOrderTypeRow – transforms a single order type DB row
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { cleanObject } = require('../utils/object-utils');
const { transformPageResult } = require('../utils/transformer-utils');
const { makeStatus } = require('../utils/status-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');

/**
 * Transforms a single order type DB row into the UI-facing shape.
 *
 * @param {OrderTypeRow} row
 * @returns {OrderTypeRecord|null}
 */
const transformOrderTypeRow = (row) => {
  if (!row) return null;

  return cleanObject({
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    requiresPayment: row.requires_payment,
    status: makeStatus(row),
    audit: compactAudit(makeAudit(row)),
  });
};

/**
 * Transforms a paginated order type result set into the UI-facing shape.
 *
 * Delegates per-row transformation to `transformOrderTypeRow` via
 * `transformPageResult`, which preserves pagination metadata.
 *
 * @param {Object}         paginatedResult
 * @param {OrderTypeRow[]} paginatedResult.data
 * @param {Object}         paginatedResult.pagination
 * @returns {Promise<PaginatedResult<OrderTypeRow>>}
 */
const transformPaginatedOrderTypes = (paginatedResult) =>
  /** @type {Promise<PaginatedResult<OrderTypeRow>>} */
  (transformPageResult(paginatedResult, transformOrderTypeRow));

module.exports = {
  transformPaginatedOrderTypes,
};
