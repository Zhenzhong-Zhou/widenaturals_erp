/**
 * @file bom-item-types.js
 * @description JSDoc typedefs for BOM item domain.
 *
 * Two categories of types:
 *   - Row types    (`RawBOMRow`)              – raw DB column aliases from the query
 *   - Record types (`BomMaterialSupplyEntry`) – transformed UI-facing shapes
 *
 * Nullable fields are those sourced from LEFT JOINed tables.
 * `_by` fields are user UUIDs typed as `string|null`, not dates.
 */

'use strict';

/**
 * Raw DB row returned by `getBomMaterialSupplyDetailsById`.
 *
 * @typedef {Object} RawBOMRow
 *
 * — BOM item core —
 * @property {string}      bom_id
 * @property {string}      bom_item_id
 * @property {string}      part_id
 * @property {string}      part_name
 *
 * — BOM item material —
 * @property {string|null} bom_item_material_id
 * @property {number|null} bom_required_qty
 * @property {string|null} bom_item_material_unit
 * @property {string|null} bom_item_material_note
 * @property {string|null} bom_item_material_status_id
 * @property {string|null} bom_item_material_status
 * @property {Date|null}   bom_item_material_status_date
 * @property {string|null} bom_item_material_created_by
 * @property {string|null} bom_item_material_created_firstname
 * @property {string|null} bom_item_material_created_lastname
 * @property {string|null} bom_item_material_updated_by
 * @property {string|null} bom_item_material_updated_firstname
 * @property {string|null} bom_item_material_updated_lastname
 * @property {Date|null}   bom_item_material_created_at
 * @property {Date|null}   bom_item_material_updated_at
 *
 * — Packaging material —
 * @property {string|null}  packaging_material_id
 * @property {string|null}  packaging_material_name
 * @property {string|null}  packaging_material_code
 * @property {string|null}  packaging_material_color
 * @property {string|null}  packaging_material_size
 * @property {string|null}  packaging_material_grade
 * @property {string|null}  packaging_material_composition
 * @property {string|null}  packaging_material_unit
 * @property {string|null}  packaging_material_category
 * @property {boolean|null} is_visible_for_sales_order
 * @property {number|null}  packaging_material_estimated_cost
 * @property {string|null}  packaging_material_currency
 * @property {number|null}  packaging_material_exchange_rate
 * @property {number|null}  length_cm
 * @property {number|null}  width_cm
 * @property {number|null}  height_cm
 * @property {number|null}  weight_g
 * @property {number|null}  length_inch
 * @property {number|null}  width_inch
 * @property {number|null}  height_inch
 * @property {number|null}  weight_lb
 * @property {string|null}  packaging_material_status_id
 * @property {string|null}  packaging_material_status
 * @property {Date|null}    packaging_material_status_date
 * @property {string|null}  packaging_material_created_by
 * @property {string|null}  packaging_material_created_firstname
 * @property {string|null}  packaging_material_created_lastname
 * @property {string|null}  packaging_material_updated_by
 * @property {string|null}  packaging_material_updated_firstname
 * @property {string|null}  packaging_material_updated_lastname
 * @property {Date|null}    packaging_material_created_at
 * @property {Date|null}    packaging_material_updated_at
 *
 * — Supplier —
 * @property {string|null}  supplier_id
 * @property {string|null}  supplier_name
 * @property {number|null}  supplier_contract_cost
 * @property {string|null}  supplier_currency
 * @property {number|null}  supplier_exchange_rate
 * @property {Date|null}    valid_from
 * @property {Date|null}    valid_to
 * @property {boolean|null} is_preferred
 * @property {number|null}  lead_time_days
 * @property {string|null}  supplier_note
 * @property {string|null}  supplier_link_created_by
 * @property {string|null}  supplier_link_created_firstname
 * @property {string|null}  supplier_link_created_lastname
 * @property {string|null}  supplier_link_updated_by
 * @property {string|null}  supplier_link_updated_firstname
 * @property {string|null}  supplier_link_updated_lastname
 * @property {Date|null}    supplier_link_created_at
 * @property {Date|null}    supplier_link_updated_at
 *
 * — Packaging material batch —
 * @property {string|null} packaging_material_batch_id
 * @property {string|null} lot_number
 * @property {string|null} material_snapshot_name
 * @property {string|null} received_label_name
 * @property {Date|null}   manufacture_date
 * @property {Date|null}   expiry_date
 * @property {number|null} batch_quantity
 * @property {string|null} batch_unit
 * @property {number|null} batch_unit_cost
 * @property {string|null} batch_currency
 * @property {number|null} batch_exchange_rate
 * @property {number|null} batch_total_cost
 * @property {string|null} batch_status_id
 * @property {string|null} batch_status
 * @property {Date|null}   batch_status_date
 * @property {string|null} batch_created_by
 * @property {string|null} batch_created_firstname
 * @property {string|null} batch_created_lastname
 * @property {string|null} batch_updated_by
 * @property {string|null} batch_updated_firstname
 * @property {string|null} batch_updated_lastname
 * @property {Date|null}   batch_created_at
 * @property {Date|null}   batch_updated_at
 */

// ---------------------------------------------------------------------------
// Transformed record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} BomBatchRecord
 * @property {string}      id
 * @property {string|null} lotNumber
 * @property {string|null} materialSnapshotName
 * @property {string|null} receivedLabelName
 * @property {Date|null}   manufactureDate
 * @property {Date|null}   expiryDate
 * @property {number}      quantity
 * @property {string|null} unit
 * @property {number}      unitCost
 * @property {string|null} currency
 * @property {number}      exchangeRate
 * @property {number}      totalCost
 * @property {{ id: string|null, name: string|null, date: Date|null }} status
 * @property {Object}      audit
 */

/**
 * @typedef {Object} BomSupplierContract
 * @property {number}      unitCost
 * @property {string|null} currency
 * @property {number}      exchangeRate
 * @property {Date|null}   validFrom
 * @property {Date|null}   validTo
 * @property {boolean}     isPreferred
 * @property {number|null} leadTimeDays
 * @property {string|null} note
 */

/**
 * @typedef {Object} BomSupplierRecord
 * @property {string}               id
 * @property {string|null}          name
 * @property {BomSupplierContract}  contract
 * @property {Object}               audit
 * @property {BomBatchRecord[]}     batches
 */

/**
 * @typedef {Object} BomDimensions
 * @property {number} length_cm
 * @property {number} width_cm
 * @property {number} height_cm
 * @property {number} weight_g
 * @property {number} length_inch
 * @property {number} width_inch
 * @property {number} height_inch
 * @property {number} weight_lb
 */

/**
 * @typedef {Object} BomPackagingMaterialRecord
 * @property {string}                id
 * @property {string|null}           name
 * @property {string|null}           code
 * @property {string|null}           color
 * @property {string|null}           size
 * @property {string|null}           grade
 * @property {string|null}           materialComposition
 * @property {string|null}           unit
 * @property {string|null}           category
 * @property {boolean}               isVisibleForSalesOrder
 * @property {number}                estimatedUnitCost
 * @property {string|null}           currency
 * @property {number}                exchangeRate
 * @property {BomDimensions}         dimensions
 * @property {{ id: string|null, name: string|null, date: Date|null }} status
 * @property {Object}                audit
 * @property {BomSupplierRecord|null} supplier
 */

/**
 * @typedef {Object} BomItemMaterialRecord
 * @property {string|null} id
 * @property {number}      requiredQtyPerProduct
 * @property {string|null} unit
 * @property {string|null} note
 * @property {{ id: string|null, name: string|null, date: Date|null }} status
 * @property {Object}      audit
 */

/**
 * Transformed BOM material supply entry (UI-facing shape).
 *
 * One entry per unique `bom_item_id`. Each entry contains a list of
 * packaging materials, each of which may have a supplier with associated batches.
 *
 * @typedef {Object} BomMaterialSupplyEntry
 * @property {string}                       bomId
 * @property {string}                       bomItemId
 * @property {{ id: string, name: string }} part
 * @property {BomItemMaterialRecord}        bomItemMaterial
 * @property {BomPackagingMaterialRecord[]} packagingMaterials
 */
