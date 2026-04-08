/**
 * @file batch-registry-transformer.js
 * @description Row-level and page-level transformers for batch registry records.
 *
 * Exports:
 *   - transformPaginatedBatchRegistryResults – transforms a paginated batch registry result set
 *
 * Internal helpers (not exported):
 *   - transformBatchRegistryRow – transforms a single batch registry row by batch type
 *
 * Supports two batch types:
 *   - `'product'`           – product batches with lot number, expiry, SKU, and manufacturer
 *   - `'packaging_material'`– packaging batches with lot number, expiry, material code, and supplier
 *
 * Rows with an unrecognised `batch_type` return `null` and are filtered out by the caller.
 */

'use strict';

const { cleanObject }       = require('../utils/object-utils');
const { makeStatus }        = require('../utils/status-utils');
const { makeActor }         = require('../utils/actor-utils');
const { transformPageResult } = require('../utils/transformer-utils');

/**
 * Transforms a single batch registry DB row into the UI-facing shape.
 *
 * Dispatches to a type-specific shape based on `row.batch_type`.
 * Returns `null` for unrecognised batch types — callers should filter these out.
 *
 * @param {BatchRegistryRow} row - Raw DB row from the batch registry query.
 * @returns {BatchRegistryRecord|null} Transformed batch registry record, or `null` if batch type is unrecognised.
 */
const transformBatchRegistryRow = (row) => {
  // Product batch shape.
  if (row.batch_type === 'product') {
    return cleanObject({
      id:   row.batch_registry_id,
      type: row.batch_type,
      
      productBatchId: row.product_batch_id,
      lotNumber:      row.product_lot_number,
      expiryDate:     row.product_expiry_date,
      
      // Product is the reference item — not the producer.
      product: cleanObject({
        id:   row.product_id,
        name: row.product_name,
      }),
      
      sku: cleanObject({
        id:   row.sku_id,
        code: row.sku_code,
      }),
      
      // Manufacturer is the producer of this batch.
      manufacturer: cleanObject({
        id:   row.manufacturer_id,
        name: row.manufacturer_name,
      }),
      
      status: makeStatus(row, {
        id:   'product_batch_status_id',
        name: 'product_batch_status_name',
        date: 'product_batch_status_date',
      }),
      
      registeredAt: row.registered_at,
      registeredBy: makeActor(
        row.registered_by,
        row.registered_by_firstname,
        row.registered_by_lastname
      ),
      
      note: row.note,
    });
  }
  
  // Packaging material batch shape.
  if (row.batch_type === 'packaging_material') {
    return cleanObject({
      id:   row.batch_registry_id,
      type: row.batch_type,
      
      packagingBatchId:     row.packaging_batch_id,
      lotNumber:            row.packaging_lot_number,
      packagingDisplayName: row.packaging_display_name,
      expiryDate:           row.packaging_expiry_date,
      
      packagingMaterial: cleanObject({
        id:   row.packaging_material_id,
        code: row.packaging_material_code,
      }),
      
      // Supplier is the producer / provider of this batch.
      supplier: cleanObject({
        id:   row.supplier_id,
        name: row.supplier_name,
      }),
      
      status: makeStatus(row, {
        id:   'packaging_batch_status_id',
        name: 'packaging_batch_status_name',
        date: 'packaging_batch_status_date',
      }),
      
      registeredAt: row.registered_at,
      registeredBy: makeActor(
        row.registered_by,
        row.registered_by_firstname,
        row.registered_by_lastname
      ),
      
      note: row.note,
    });
  }
  
  // Unrecognised batch type — defensive fallback, should never occur in practice.
  return null;
};

/**
 * Transforms a paginated batch registry result set into the UI-facing shape.
 *
 * Delegates per-row transformation to `transformBatchRegistryRow` via
 * `transformPageResult`, which preserves pagination metadata.
 *
 * Rows returning `null` from `transformBatchRegistryRow` (unrecognised batch types)
 * are handled by `transformPageResult`'s filtering behaviour.
 *
 * @param {Object}        paginatedResult              - Raw paginated result from the repository.
 * @param {Array<BatchRegistryRow>} paginatedResult.data         - Raw DB rows.
 * @param {Object}        paginatedResult.pagination   - Pagination metadata.
 * @returns {Promise<PaginatedResult<BatchRegistryRow>>} Transformed records and pagination metadata.
 */
const transformPaginatedBatchRegistryResults = (paginatedResult) =>
  transformPageResult(paginatedResult, transformBatchRegistryRow);

module.exports = {
  transformPaginatedBatchRegistryResults,
};
