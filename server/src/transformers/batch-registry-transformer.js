const { cleanObject } = require('../utils/object-utils');
const { makeStatus } = require('../utils/status-utils');
const { makeActor } = require('../utils/actor-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * @typedef {Object} BatchRegistryRow
 *
 * Core registry fields
 * @property {string} batch_registry_id
 * @property {'product'|'packaging_material'} batch_type
 * @property {string} registered_at
 * @property {string} registered_by
 * @property {string|null} registered_by_firstname
 * @property {string|null} registered_by_lastname
 * @property {string|null} note
 *
 * ─────────────────────────────────────────────
 * Product batch fields (batch_type === 'product')
 * ─────────────────────────────────────────────
 * @property {string|null} product_batch_id
 * @property {string|null} product_lot_number
 * @property {string|null} product_expiry_date
 * @property {string|null} product_batch_status_id
 * @property {string|null} product_batch_status_name
 * @property {string|null} product_batch_status_date
 *
 * @property {string|null} sku_id
 * @property {string|null} sku_code
 *
 * @property {string|null} product_id
 * @property {string|null} product_name
 *
 * @property {string|null} manufacturer_id
 * @property {string|null} manufacturer_name
 *
 * ─────────────────────────────────────────────
 * Packaging material batch fields
 * (batch_type === 'packaging_material')
 * ─────────────────────────────────────────────
 * @property {string|null} packaging_batch_id
 * @property {string|null} packaging_lot_number
 * @property {string|null} packaging_expiry_date
 * @property {string|null} packaging_batch_status_id
 * @property {string|null} packaging_batch_status_name
 * @property {string|null} packaging_batch_status_date
 *
 * @property {string|null} packaging_material_id
 * @property {string|null} packaging_material_name
 *
 * @property {string|null} supplier_id
 * @property {string|null} supplier_name
 */

/**
 * Transform a single batch registry row into a UI-ready representation.
 *
 * Responsibility:
 * - Normalize polymorphic batch registry rows
 * - Return ONLY the relevant branch based on `batch_type`
 * - Strip null / undefined fields for clean API output
 *
 * IMPORTANT:
 * - This transformer is designed for BATCH REGISTRY LIST & DETAIL VIEWS
 * - It intentionally excludes inventory, QA, warehouse, and financial fields
 *
 * This function MUST NOT:
 * - Enforce visibility
 * - Perform filtering
 * - Apply business rules
 *
 * It ASSUMES:
 * - The row has already passed ACL + SQL enforcement
 *
 * @param {BatchRegistryRow} row
 * @returns {Object|null}
 */
const transformBatchRegistryRow = (row) => {
  // ------------------------------
  // Product batch
  // ------------------------------
  if (row.batch_type === 'product') {
    return cleanObject({
      id: row.batch_registry_id,
      type: row.batch_type,
      
      productBatchId: row.product_batch_id,
      lotNumber: row.product_lot_number,
      expiryDate: row.product_expiry_date,
      
      product: {
        id: row.product_id,
        name: row.product_name,
        sku: row.sku_code,
        manufacturer: cleanObject({
          id: row.manufacturer_id,
          name: row.manufacturer_name,
        }),
      },
      
      status: makeStatus(row, {
        id: 'product_batch_status_id',
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
  
  // ------------------------------
  // Packaging material batch
  // ------------------------------
  if (row.batch_type === 'packaging_material') {
    return cleanObject({
      id: row.batch_registry_id,
      type: row.batch_type,
      
      packagingBatchId: row.packaging_batch_id,
      lotNumber: row.packaging_lot_number,
      expiryDate: row.packaging_expiry_date,
      
      packagingMaterial: {
        id: row.packaging_material_id,
        name: row.packaging_material_name,
        supplier: cleanObject({
          id: row.supplier_id,
          name: row.supplier_name,
        }),
      },
      
      status: makeStatus(row, {
        id: 'packaging_batch_status_id',
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
  
  // Defensive fallback — should never occur
  return null;
};

/**
 * Transform paginated batch registry results for UI consumption.
 *
 * Responsibility:
 * - Preserve pagination metadata (page, limit, totals)
 * - Apply per-row batch registry transformation
 *
 * This function:
 * - Does NOT alter pagination semantics
 * - Does NOT filter rows
 *
 * @param {Object} paginatedResult
 * @returns {Object}
 */
const transformPaginatedBatchRegistryResults = (paginatedResult) => {
  return transformPaginatedResult(paginatedResult, transformBatchRegistryRow);
};

module.exports = {
  transformPaginatedBatchRegistryResults,
};
