/**
 * @file inventory-activity-report-types.js
 * @description JSDoc typedefs for the inventory activity report domain.
 *
 * Two categories of types:
 *   - Row types    – raw DB column aliases from repository queries
 *   - Record types – transformed UI-facing shapes
 */

'use strict';

// ---------------------------------------------------------------------------
// Row types (raw DB shapes)
// ---------------------------------------------------------------------------

/**
 * Raw DB row returned by the inventory activity log queries.
 *
 * @typedef {Object} InventoryActivityLogRow
 * @property {string}      id
 * @property {string|null} action_timestamp
 * @property {string|null} action_type
 * @property {string|null} adjustment_type
 * @property {string|null} status_name
 * @property {string|null} performed_by
 * @property {string|null} order_number
 * @property {string|null} order_type
 * @property {string|null} order_status
 * @property {string|null} source_type
 * @property {string|null} source_ref_id
 * @property {number|null} previous_quantity
 * @property {number|null} quantity_change
 * @property {number|null} new_quantity
 * @property {string|null} comments
 * @property {Object|null} metadata
 * @property {string|null} batch_type
 * @property {string|null} warehouse_name
 * @property {string|null} location_name
 *
 * — Product batch fields (null when batch_type = 'packaging_material') —
 * @property {string|null} sku_code
 * @property {string|null} product_name
 * @property {string|null} brand
 * @property {string|null} country_code
 * @property {string|null} product_lot_number
 * @property {string|null} product_expiry_date
 *
 * — Packaging material batch fields (null when batch_type = 'product') —
 * @property {string|null} material_lot_number
 * @property {string|null} material_expiry_date
 * @property {string|null} material_snapshot_name
 * @property {string|null} material_code
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed inventory activity log entry.
 *
 * @typedef {Object} InventoryActivityLogRecord
 * @property {string}      id
 * @property {string|null} actionTimestamp
 * @property {string|null} actionType
 * @property {string|null} adjustmentType
 * @property {string|null} status
 * @property {string|null} performedBy
 * @property {{ number: string|null, type: string|null, status: string|null }} order
 * @property {{ type: string|null, refId: string|null }} source
 * @property {{ previous: number|null, change: number|null, new: number|null }} quantity
 * @property {string|null} comments
 * @property {Object|null} metadata
 * @property {string|null} batchType
 * @property {string|null} warehouseName
 * @property {string|null} locationName
 * @property {{
 *   sku: string|null,
 *   productName: string|null,
 *   lotNumber: string|null,
 *   expiryDate: string|null
 * }|null} productInfo
 * @property {{
 *   lotNumber: string|null,
 *   expiryDate: string|null,
 *   snapshotName: string|null,
 *   code: string|null
 * }|null} packagingMaterialInfo
 */
