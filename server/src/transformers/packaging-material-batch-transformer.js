/**
 * @file packaging-material-batch-transformer.js
 * @description Row-level and page-level transformers for packaging material batch records.
 *
 * Exports:
 *   - transformPaginatedPackagingMaterialBatchResults – paginated batch list
 *   - transformPackagingMaterialBatchRecords          – insert result records
 *
 * Internal helpers (not exported):
 *   - transformPackagingMaterialBatchRow – per-row transformer for paginated list
 *
 * All functions are pure — no logging, no AppError, no side effects.
 */

'use strict';

const { cleanObject } = require('../utils/object-utils');
const { makeStatus } = require('../utils/status-utils');
const { makeActor } = require('../utils/actor-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { transformPageResult } = require('../utils/transformer-utils');

/**
 * Transforms a single paginated packaging material batch DB row into the UI-facing shape.
 *
 * Supplier fields are conditionally included based on the resolved access scope.
 *
 * @param {PackagingMaterialBatchRow} row
 * @param {{ canViewSupplier: boolean }} access
 * @returns {PackagingMaterialBatchRecord}
 */
const transformPackagingMaterialBatchRow = (row, access) =>
  cleanObject({
    id: row.id,
    lotNumber: row.lot_number,

    material: {
      internalName: row.material_snapshot_name,
      supplierLabel: row.received_label_name,
    },

    quantity: {
      value: row.quantity,
      unit: row.unit,
    },

    lifecycle: {
      manufactureDate: row.manufacture_date,
      expiryDate: row.expiry_date,
      receivedAt: row.received_at,
      receivedBy: makeActor(
        row.received_by_id,
        row.received_by_firstname,
        row.received_by_lastname
      ),
    },

    cost: cleanObject({
      unitCost: row.unit_cost,
      currency: row.currency,
      exchangeRate: row.exchange_rate,
      totalCost: row.total_cost,
    }),

    status: makeStatus(row),

    packagingMaterial: cleanObject({
      id: row.packaging_material_id,
      code: row.packaging_material_code,
      category: row.packaging_material_category,
    }),

    // Supplier fields gated by access scope.
    supplier: access.canViewSupplier
      ? cleanObject({
          id: row.supplier_id,
          name: row.supplier_name,
          isPreferred: row.is_preferred,
          leadTimeDays: row.lead_time_days,
        })
      : null,

    audit: compactAudit(makeAudit(row)),
  });

/**
 * Transforms a paginated packaging material batch result set into the UI-facing shape.
 *
 * Delegates per-row transformation to `transformPackagingMaterialBatchRow` via
 * `transformPageResult`, which preserves pagination metadata.
 *
 * @param {Object}                          paginatedResult
 * @param {PackagingMaterialBatchRow[]}     paginatedResult.data
 * @param {Object}                          paginatedResult.pagination
 * @param {{ canViewSupplier: boolean }}    access
 * @returns {Promise<PaginatedResult<PackagingMaterialBatchRow>>}
 */
const transformPaginatedPackagingMaterialBatchResults = (
  paginatedResult,
  access
) =>
  /** @type {Promise<PaginatedResult<PackagingMaterialBatchRow>>} */
  (
    transformPageResult(paginatedResult, (row) =>
      transformPackagingMaterialBatchRow(row, access)
    )
  );

/**
 * Transforms an array of packaging material batch insert rows into the insert result shape.
 *
 * Returns an empty array if the input is not a valid non-empty array.
 *
 * @param {PackagingMaterialBatchInsertRow[]} rows
 * @returns {PackagingMaterialBatchInsertRecord[]}
 */
const transformPackagingMaterialBatchRecords = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows.map((row) => ({
    id: row.id,
    lotNumber: row.lot_number,
    packagingMaterialSupplierId: row.packaging_material_supplier_id,
    manufactureDate: row.manufacture_date ?? null,
    expiryDate: row.expiry_date ?? null,
    initialQuantity: Number(row.quantity),
    statusId: row.status_id,
  }));
};

module.exports = {
  transformPaginatedPackagingMaterialBatchResults,
  transformPackagingMaterialBatchRecords,
};
