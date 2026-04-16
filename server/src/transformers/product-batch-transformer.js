/**
 * @file product-batch-transformer.js
 * @description Row-level and page-level transformers for product batch records.
 *
 * Exports:
 *   - transformPaginatedProductBatchResults – paginated batch list
 *   - transformProductBatchRecords          – insert result records
 *   - transformProductBatchDetail           – single batch detail
 *
 * Internal helpers (not exported):
 *   - transformProductBatchRow – per-row transformer for paginated list
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { cleanObject } = require('../utils/object-utils');
const { makeStatus } = require('../utils/status-utils');
const { makeActor } = require('../utils/actor-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { transformPageResult } = require('../utils/transformer-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');
const { getFullName } = require('../utils/person-utils');

/**
 * Transforms a single paginated product batch DB row into the UI-facing shape.
 *
 * Manufacturer fields are conditionally included based on the resolved access scope.
 *
 * @param {ProductBatchRow}                  row
 * @param {{ canViewManufacturer: boolean }} access
 * @returns {Object}
 */
const transformProductBatchRow = (row, access) =>
  cleanObject({
    id: row.id,
    lotNumber: row.lot_number,

    sku: cleanObject({
      id: row.sku_id,
      code: row.sku_code,
      sizeLabel: row.size_label,
    }),

    product: cleanObject({
      id: row.product_id,
      name: row.product_name,
      brand: row.brand,
      category: row.category,
      displayName: getProductDisplayName({
        product_name: row.product_name,
        brand: row.brand,
        sku: row.sku_code,
        country_code: row.country_code,
      }),
    }),

    // Manufacturer fields gated by access scope.
    manufacturer: access.canViewManufacturer
      ? cleanObject({
          id: row.manufacturer_id,
          name: row.manufacturer_name,
        })
      : null,

    lifecycle: {
      manufactureDate: row.manufacture_date,
      expiryDate: row.expiry_date,
      receivedDate: row.received_date,
      initialQuantity: row.initial_quantity,
    },

    status: makeStatus(row),

    releasedAt: row.released_at,
    releasedBy: makeActor(
      row.released_by_id,
      row.released_by_firstname,
      row.released_by_lastname
    ),

    audit: compactAudit(makeAudit(row)),
  });

/**
 * Transforms a paginated product batch result set into the UI-facing shape.
 *
 * Delegates per-row transformation to `transformProductBatchRow` via
 * `transformPageResult`, which preserves pagination metadata.
 *
 * @param {Object}                           paginatedResult
 * @param {ProductBatchRow[]}                paginatedResult.data
 * @param {Object}                           paginatedResult.pagination
 * @param {{ canViewManufacturer: boolean }} access
 * @returns {Promise<PaginatedResult<ProductBatchRow>>}
 */
const transformPaginatedProductBatchResults = (paginatedResult, access) =>
  /** @type {Promise<PaginatedResult<ProductBatchRow>>} */
  (
    transformPageResult(paginatedResult, (row) =>
      transformProductBatchRow(row, access)
    )
  );

/**
 * Transforms an array of product batch insert rows into insert result records.
 *
 * Returns an empty array if the input is not a valid non-empty array.
 *
 * @param {ProductBatchInsertRow[]} rows
 * @returns {ProductBatchInsertRecord[]}
 */
const transformProductBatchRecords = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows.map((row) => ({
    id: row.id,
    lotNumber: row.lot_number,
    skuId: row.sku_id,
    manufactureDate: row.manufacture_date ?? null,
    expiryDate: row.expiry_date ?? null,
    initialQuantity: row.initial_quantity,
    statusId: row.status_id,
  }));
};

/**
 * Transforms a single product batch detail DB row into the full detail shape.
 *
 * @param {ProductBatchDetailRow} row
 * @returns {Object}
 */
const transformProductBatchDetail = (row) =>
  cleanObject({
    id: row.id,
    lotNumber: row.lot_number,
    initialQuantity: row.initial_quantity ?? null,
    manufactureDate: row.manufacture_date ?? null,
    expiryDate: row.expiry_date ?? null,
    receivedAt: row.received_at ?? null,
    releasedAt: row.released_at ?? null,
    notes: row.notes ?? null,

    status: {
      id: row.batch_status_id,
      name: row.batch_status_name ?? null,
      date: row.status_date ?? null,
    },

    sku: row.sku_id
      ? {
          id: row.sku_id,
          code: row.sku,
          barcode: row.barcode ?? null,
          sizeLabel: row.size_label ?? null,
          marketRegion: row.market_region ?? null,
          status: {
            id: row.sku_status_id ?? null,
            name: row.sku_status_name ?? null,
          },
        }
      : null,

    product: row.product_id
      ? {
          id: row.product_id,
          name: row.product_name,
          brand: row.brand ?? null,
          category: row.category ?? null,
          status: {
            id: row.product_status_id ?? null,
            name: row.product_status_name ?? null,
          },
        }
      : null,

    manufacturer: row.manufacturer_id
      ? {
          id: row.manufacturer_id,
          name: row.manufacturer_name,
          status: {
            id: row.manufacturer_status_id ?? null,
            name: row.manufacturer_status_name ?? null,
          },
        }
      : null,

    receivedBy: row.received_by_id
      ? {
          id: row.received_by_id,
          name: getFullName(
            row.received_by_firstname,
            row.received_by_lastname
          ),
        }
      : null,

    releasedBy: row.released_by_id
      ? {
          id: row.released_by_id,
          name: getFullName(
            row.released_by_firstname,
            row.released_by_lastname
          ),
        }
      : null,

    audit: compactAudit(makeAudit(row)),
  });

module.exports = {
  transformPaginatedProductBatchResults,
  transformProductBatchRecords,
  transformProductBatchDetail,
};
