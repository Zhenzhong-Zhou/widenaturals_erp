/**
 * @fileoverview
 * Transformer utilities for Product Batch list and detail views.
 *
 * This module is responsible for shaping flat database rows
 * into UI-ready Product Batch representations.
 *
 * Architectural notes:
 * - This transformer operates on a single domain (product batches only)
 * - Row-level visibility is enforced upstream (business + repository)
 * - Field-level visibility (e.g. manufacturer) is applied here
 * - No filtering, permission evaluation, or business logic occurs here
 */

const { cleanObject } = require('../utils/object-utils');
const { makeStatus } = require('../utils/status-utils');
const { makeActor } = require('../utils/actor-utils');
const { compactAudit, makeAudit } = require('../utils/audit-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');
const { getProductDisplayName } = require('../utils/display-name-utils');

/**
 * @typedef {Object} ProductBatchRow
 *
 * Flat product batch row returned from repository queries.
 * This type represents a denormalized join result and is NOT
 * intended for direct UI consumption.
 *
 * All permission enforcement must occur outside this structure.
 *
 * Core batch fields
 * @property {string} id
 * @property {string} lot_number
 * @property {string} sku_id
 * @property {string} sku_code
 * @property {string|null} size_label
 * @property {string|null} country_code
 *
 * Product fields
 * @property {string} product_id
 * @property {string} product_name
 * @property {string|null} brand
 * @property {string|null} category
 *
 * Manufacturer fields
 * @property {string|null} manufacturer_id
 * @property {string|null} manufacturer_name
 *
 * Batch lifecycle
 * @property {string} manufacture_date
 * @property {string} expiry_date
 * @property {string|null} received_date
 * @property {number} initial_quantity
 *
 * Status
 * @property {string} status_id
 * @property {string} status_name
 * @property {string} status_date
 *
 * Release audit
 * @property {string|null} released_at
 * @property {string|null} released_by_id
 * @property {string|null} released_by_firstname
 * @property {string|null} released_by_lastname
 *
 * Creation audit
 * @property {string} created_at
 * @property {string} created_by_id
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 *
 * Update audit
 * @property {string|null} updated_at
 * @property {string|null} updated_by_id
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 */

/**
 * Transform a single product batch row into a UI-ready structure.
 *
 * Responsibilities:
 * - Convert flat repository rows into structured product batch output
 * - Normalize lifecycle, status, actor, and audit information
 * - Apply field-level visibility (e.g. manufacturer projection)
 * - Remove null / undefined fields for clean API responses
 *
 * Explicitly does NOT:
 * - Perform permission checks
 * - Filter or exclude rows
 * - Apply search logic or ACL evaluation
 *
 * Assumptions:
 * - Row-level visibility has already been enforced upstream
 * - `access` contains evaluated visibility capabilities
 *
 * @param {ProductBatchRow} row
 * @param {Object} access - Evaluated visibility flags
 * @returns {Object} UI-ready product batch representation
 */
const transformProductBatchRow = (row, access) => {
  return cleanObject({
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
};

/**
 * Transform paginated product batch query results for UI consumption.
 *
 * Responsibilities:
 * - Preserve pagination metadata
 * - Apply product batch row transformation consistently
 *
 * Notes:
 * - This function does not modify pagination semantics
 * - All rows are assumed to be product batch rows
 *
 * @param {Object} paginatedResult
 * @param {Object} access - Evaluated visibility flags
 * @returns {Object} Paginated, transformed product batch result
 */
const transformPaginatedProductBatchResults = (paginatedResult, access) => {
  return transformPaginatedResult(paginatedResult, (row) =>
    transformProductBatchRow(row, access)
  );
};

module.exports = {
  transformPaginatedProductBatchResults,
};
