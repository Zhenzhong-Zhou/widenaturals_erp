/**
 * @fileoverview
 * Transformer utilities for Packaging Material Batch list and detail views.
 *
 * This module is responsible for shaping flat database rows
 * into UI-ready Packaging Material Batch representations.
 *
 * Architectural notes:
 * - Operates on a single domain (packaging material batches only)
 * - Row-level visibility is enforced upstream (business + repository)
 * - Field-level visibility (e.g. supplier) is applied here
 * - No filtering, permission evaluation, or business logic occurs here
 */

const { cleanObject } = require('../utils/object-utils');
const { makeStatus } = require('../utils/status-utils');
const { makeActor } = require('../utils/actor-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * @typedef {Object} PackagingMaterialBatchRow
 *
 * Flat packaging material batch row returned from repository queries.
 *
 * Core batch fields
 * @property {string} id
 * @property {string} lot_number
 * @property {number} quantity
 * @property {string} unit
 *
 * Snapshot identity
 * @property {string|null} material_snapshot_name
 * @property {string|null} received_label_name
 *
 * Lifecycle
 *
 * Represents domain lifecycle events for a packaging material batch.
 * These are real-world events, not system audit metadata.
 *
 * @property {string|null} manufacture_date
 * @property {string|null} expiry_date
 *
 * @property {string} received_at
 *   Timestamp when the batch was physically received.
 *
 * @property {string|null} received_by_id
 * @property {string|null} received_by_firstname
 * @property {string|null} received_by_lastname
 *
 * Cost
 * @property {number|null} unit_cost
 * @property {string|null} currency
 * @property {number|null} exchange_rate
 * @property {number|null} total_cost
 *
 * Status
 * @property {string} status_id
 * @property {string} status_name
 * @property {string} status_date
 *
 * Packaging material (reference-only)
 * @property {string} packaging_material_id
 * @property {string} packaging_material_code
 * @property {string|null} packaging_material_category
 *
 * Supplier
 * @property {string} supplier_id
 * @property {string} supplier_name
 *
 * Supplier relationship
 * @property {boolean} is_preferred
 * @property {number|null} lead_time_days
 *
 * Audit
 * @property {string} created_at
 * @property {string} created_by_id
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_at
 * @property {string|null} updated_by_id
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 */

/**
 * Transform a single packaging material batch row into a UI-ready structure.
 *
 * Responsibilities:
 * - Convert flat repository rows into structured PMB output
 * - Preserve snapshot-first identity
 * - Normalize lifecycle, status, actor, and audit information
 * - Apply supplier field visibility
 * - Remove null / undefined fields
 *
 * Explicitly does NOT:
 * - Perform permission checks
 * - Filter or exclude rows
 * - Apply search or ACL logic
 *
 * @param {PackagingMaterialBatchRow} row
 * @param {Object} access - Evaluated visibility flags
 * @returns {Object} UI-ready packaging material batch representation
 */
const transformPackagingMaterialBatchRow = (row, access) => {
  return cleanObject({
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
};

/**
 * Transform paginated packaging material batch query results for UI consumption.
 *
 * Responsibilities:
 * - Preserve pagination metadata
 * - Apply PMB row transformation consistently
 *
 * @param {Object} paginatedResult
 * @param {Object} access - Evaluated visibility flags
 * @returns {Object} Paginated, transformed PMB result
 */
const transformPaginatedPackagingMaterialBatchResults = (
  paginatedResult,
  access
) => {
  return transformPaginatedResult(
    paginatedResult,
    (row) => transformPackagingMaterialBatchRow(row, access)
  );
};

module.exports = {
  transformPaginatedPackagingMaterialBatchResults,
};
