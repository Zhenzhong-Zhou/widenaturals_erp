/**
 * @file product-transformer.js
 * @description Row-level and page-level transformers for product records.
 *
 * Exports:
 *   - transformPaginatedProductResults – paginated product list
 *   - transformProductDetail           – single product detail
 *   - transformProductList             – bulk insert result list
 *
 * Internal helpers (not exported):
 *   - transformProductRow – base per-row transformer shared by list and detail views
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { cleanObject } = require('../utils/object-utils');
const { transformPageResult } = require('../utils/transformer-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');

/**
 * Transforms a single product DB row into the base UI-facing shape.
 *
 * Used by both the paginated list and the detail transformer.
 * Pass `includeDescription: true` to include the description field.
 *
 * @param {ProductRow} row
 * @param {{ includeDescription?: boolean }} [options={}]
 * @returns {ProductRecord|ProductDetailRecord}
 */
const transformProductRow = (row, { includeDescription = false } = {}) =>
  cleanObject({
    id: row.id,
    name: row.name,
    series: row.series ?? null,
    brand: row.brand ?? null,
    category: row.category ?? null,
    ...(includeDescription && { description: row.description ?? null }),
    status: {
      id: row.status_id,
      name: row.status_name ?? null,
      date: row.status_date ?? null,
    },
    audit: compactAudit(makeAudit(row)),
  });

/**
 * Transforms a paginated product result set into the list view shape.
 *
 * Delegates per-row transformation to `transformProductRow` via
 * `transformPageResult`, which preserves pagination metadata.
 *
 * @param {Object}       paginatedResult
 * @param {ProductRow[]} paginatedResult.data
 * @param {Object}       paginatedResult.pagination
 * @returns {Promise<PaginatedResult<ProductRow>>}
 */
const transformPaginatedProductResults = (paginatedResult) =>
  /** @type {Promise<PaginatedResult<ProductRow>>} */
  (transformPageResult(paginatedResult, (row) => transformProductRow(row)));

/**
 * Transforms a single product DB row into the full detail shape.
 *
 * Includes the `description` field in addition to the base list shape.
 *
 * @param {ProductRow} row
 * @returns {ProductDetailRecord}
 */
const transformProductDetail = (row) =>
  /** @type {ProductDetailRecord} */ (
    transformProductRow(row, { includeDescription: true })
  );

/**
 * Transforms an array of product insert rows into ID-only result records.
 *
 * Returns an empty array if the input is not a valid array.
 *
 * @param {ProductInsertRow[]} [rows=[]]
 * @returns {ProductInsertRecord[]}
 */
const transformProductList = (rows = []) => {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => (row ? { id: row.id } : null)).filter(Boolean);
};

module.exports = {
  transformPaginatedProductResults,
  transformProductDetail,
  transformProductList,
};
