/**
 * @file packaging-material-batch-types.js
 * @description JSDoc typedefs for the packaging material batch domain.
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
 * Raw DB row returned by the paginated packaging material batch query.
 *
 * @typedef {Object} PackagingMaterialBatchRow
 * @property {string}       id
 * @property {string}       lot_number
 * @property {string|null}  material_snapshot_name
 * @property {string|null}  received_label_name
 * @property {number|null}  quantity
 * @property {string|null}  unit
 * @property {string|null}  manufacture_date
 * @property {string|null}  expiry_date
 * @property {string|null}  received_at
 * @property {string|null}  received_by_id
 * @property {string|null}  received_by_firstname
 * @property {string|null}  received_by_lastname
 * @property {number|null}  unit_cost
 * @property {string|null}  currency
 * @property {number|null}  exchange_rate
 * @property {number|null}  total_cost
 * @property {string|null}  status_id
 * @property {string|null}  status_name
 * @property {string|null}  status_date
 * @property {string|null}  packaging_material_id
 * @property {string|null}  packaging_material_code
 * @property {string|null}  packaging_material_category
 * @property {string|null}  supplier_id
 * @property {string|null}  supplier_name
 * @property {boolean|null} is_preferred
 * @property {number|null}  lead_time_days
 * @property {string|null}  created_at
 * @property {string|null}  updated_at
 * @property {string|null}  created_by
 * @property {string|null}  created_by_firstname
 * @property {string|null}  created_by_lastname
 * @property {string|null}  updated_by
 * @property {string|null}  updated_by_firstname
 * @property {string|null}  updated_by_lastname
 */

/**
 * Raw DB row returned by the batch insert query.
 *
 * @typedef {Object} PackagingMaterialBatchInsertRow
 * @property {string}      id
 * @property {string}      lot_number
 * @property {string}      packaging_material_supplier_id
 * @property {string|null} manufacture_date
 * @property {string|null} expiry_date
 * @property {number}      quantity
 * @property {string}      status_id
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed packaging material batch record for paginated table view.
 *
 * @typedef {Object} PackagingMaterialBatchRecord
 * @property {string}      id
 * @property {string}      lotNumber
 * @property {{ internalName: string|null, supplierLabel: string|null }} material
 * @property {{ value: number|null, unit: string|null }} quantity
 * @property {{
 *   manufactureDate: string|null,
 *   expiryDate: string|null,
 *   receivedAt: string|null,
 *   receivedBy: Object|null
 * }} lifecycle
 * @property {{ unitCost: number|null, currency: string|null, exchangeRate: number|null, totalCost: number|null }|null} cost
 * @property {{ id: string|null, name: string|null, date: string|null }} status
 * @property {{ id: string|null, code: string|null, category: string|null }|null} packagingMaterial
 * @property {{ id: string|null, name: string|null, isPreferred: boolean|null, leadTimeDays: number|null }|null} supplier
 * @property {Object} audit
 */

/**
 * Transformed packaging material batch insert result.
 *
 * @typedef {Object} PackagingMaterialBatchInsertRecord
 * @property {string}      id
 * @property {string}      lotNumber
 * @property {string}      packagingMaterialSupplierId
 * @property {string|null} manufactureDate
 * @property {string|null} expiryDate
 * @property {number}      initialQuantity
 * @property {string}      statusId
 */
