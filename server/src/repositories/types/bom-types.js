/**
 * @file bom-types.js
 * @description JSDoc typedefs for the BOM domain.
 *
 * Two categories of types:
 *   - Row types    – raw DB column aliases from repository queries
 *   - Record types – transformed UI-facing shapes
 *
 * Nullable fields are those sourced from LEFT JOINed tables.
 * `_by` fields are user UUIDs typed as `string|null`, not dates.
 */

'use strict';

// ---------------------------------------------------------------------------
// Row types (raw DB shapes)
// ---------------------------------------------------------------------------

/**
 * Raw DB row returned by the paginated BOM query (`getPaginatedBoms`).
 *
 * @typedef {Object} RawBOMRow
 * @property {string}      product_id
 * @property {string}      product_name
 * @property {string|null} brand
 * @property {string|null} series
 * @property {string|null} category
 * @property {string}      sku_id
 * @property {string}      sku_code
 * @property {string|null} barcode
 * @property {string|null} language
 * @property {string|null} country_code
 * @property {string|null} market_region
 * @property {string|null} size_label
 * @property {string|null} sku_description
 * @property {string|null} compliance_id
 * @property {string|null} compliance_type
 * @property {string|null} compliance_number
 * @property {string|null} compliance_status
 * @property {string|null} compliance_issued_date
 * @property {string|null} compliance_expiry_date
 * @property {string}      bom_id
 * @property {string}      bom_code
 * @property {string}      bom_name
 * @property {number}      bom_revision
 * @property {boolean}     is_active
 * @property {boolean}     is_default
 * @property {string|null} bom_description
 * @property {string|null} bom_status_id
 * @property {string|null} bom_status
 * @property {string|null} bom_status_date
 * @property {string}      bom_created_at
 * @property {string}      bom_created_by
 * @property {string|null} bom_created_by_firstname
 * @property {string|null} bom_created_by_lastname
 * @property {string|null} bom_updated_at
 * @property {string|null} bom_updated_by
 * @property {string|null} bom_updated_by_firstname
 * @property {string|null} bom_updated_by_lastname
 */

/**
 * Raw DB row returned by the BOM detail query (`getBomDetailsById`).
 *
 * Extends the paginated row with BOM item and part columns.
 *
 * @typedef {Object} BomDetailsRow
 * @property {string}      product_id
 * @property {string}      product_name
 * @property {string|null} brand
 * @property {string|null} series
 * @property {string|null} category
 * @property {string}      sku_id
 * @property {string}      sku_code
 * @property {string|null} barcode
 * @property {string|null} language
 * @property {string|null} country_code
 * @property {string|null} market_region
 * @property {string|null} size_label
 * @property {string|null} sku_description
 * @property {string|null} compliance_id
 * @property {string|null} compliance_type
 * @property {string|null} compliance_number
 * @property {string|null} compliance_issued_date
 * @property {string|null} compliance_expiry_date
 * @property {string|null} compliance_description
 * @property {string|null} compliance_status_id
 * @property {string|null} compliance_status
 * @property {string}      bom_id
 * @property {string}      bom_code
 * @property {string}      bom_name
 * @property {number}      bom_revision
 * @property {boolean}     bom_is_active
 * @property {boolean}     bom_is_default
 * @property {string|null} bom_description
 * @property {string|null} bom_status_id
 * @property {string|null} bom_status
 * @property {Date|null}   bom_status_date
 * @property {Date|null}   bom_created_at
 * @property {string|null} bom_created_by
 * @property {string|null} bom_created_by_firstname
 * @property {string|null} bom_created_by_lastname
 * @property {Date|null}   bom_updated_at
 * @property {string|null} bom_updated_by
 * @property {string|null} bom_updated_by_firstname
 * @property {string|null} bom_updated_by_lastname
 * @property {string|null} bom_item_id
 * @property {string|null} part_qty_per_product
 * @property {string|null} unit
 * @property {string|null} specifications
 * @property {string|null} estimated_unit_cost
 * @property {string|null} currency
 * @property {number}      exchange_rate
 * @property {string|null} note
 * @property {Date|null}   bom_item_created_at
 * @property {string|null} bom_item_created_by
 * @property {string|null} bom_item_created_by_firstname
 * @property {string|null} bom_item_created_by_lastname
 * @property {Date|null}   bom_item_updated_at
 * @property {string|null} bom_item_updated_by
 * @property {string|null} bom_item_updated_by_firstname
 * @property {string|null} bom_item_updated_by_lastname
 * @property {string|null} part_id
 * @property {string|null} part_code
 * @property {string|null} part_name
 * @property {string|null} part_type
 * @property {string|null} unit_of_measure
 * @property {string|null} part_description
 */

/**
 * Raw DB row returned by the BOM production summary query (`getBomProductionSummary`).
 *
 * @typedef {Object} BOMProductionSummaryRow
 * @property {string}      part_id
 * @property {string}      part_name
 * @property {number}      required_qty_per_unit
 * @property {number}      total_available_quantity
 * @property {number|null} max_producible_units
 * @property {boolean}     is_shortage
 * @property {number}      shortage_qty
 * @property {string|null} packaging_material_batch_id
 * @property {string|null} material_name
 * @property {string|null} material_snapshot_name
 * @property {string|null} received_label_name
 * @property {string|null} lot_number
 * @property {number|null} batch_quantity
 * @property {number|null} warehouse_quantity
 * @property {number|null} reserved_quantity
 * @property {number|null} available_quantity
 * @property {string|null} inventory_status
 * @property {string|null} warehouse_name
 * @property {string|null} supplier_name
 * @property {string|null} inbound_date
 * @property {string|null} outbound_date
 * @property {string|null} last_update
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} BomComplianceRecord
 * @property {string|null} id
 * @property {string|null} type
 * @property {string|null} number
 * @property {string|null} status
 * @property {string|null} issuedDate
 * @property {string|null} expiryDate
 */

/**
 * @typedef {Object} BomProductRecord
 * @property {string}      id
 * @property {string}      name
 * @property {string|null} brand
 * @property {string|null} series
 * @property {string|null} category
 */

/**
 * @typedef {Object} BomSkuRecord
 * @property {string}                   id
 * @property {string}                   code
 * @property {string|null}              barcode
 * @property {string|null}              language
 * @property {string|null}              countryCode
 * @property {string|null}              marketRegion
 * @property {string|null}              sizeLabel
 * @property {string|null}              description
 */

/**
 * @typedef {Object} BomStatusRecord
 * @property {string|null} id
 * @property {string|null} name
 * @property {string|null} date
 */

/**
 * @typedef {Object} BomRecord
 * @property {string}          id
 * @property {string}          code
 * @property {string}          name
 * @property {number}          revision
 * @property {boolean}         isActive
 * @property {boolean}         isDefault
 * @property {string|null}     description
 * @property {BomStatusRecord} status
 * @property {Object}          audit
 */

/**
 * Transformed paginated BOM row (UI-facing shape).
 *
 * @typedef {Object} BOMRecord
 * @property {BomProductRecord} product
 * @property {BomSkuRecord}     sku
 * @property {BomRecord}        bom
 */

/**
 * @typedef {Object} BomItemRecord
 * @property {string}      id
 * @property {number|null} partQtyPerProduct
 * @property {string|null} unit
 * @property {string|null} specifications
 * @property {number|null} estimatedUnitCost
 * @property {string|null} currency
 * @property {number}      exchangeRate
 * @property {string|null} note
 * @property {{
 *   id: string|null,
 *   code: string|null,
 *   name: string|null,
 *   type: string|null,
 *   unitOfMeasure: string|null,
 *   description: string|null
 * }} part
 * @property {Object} audit
 */

/**
 * Transformed BOM detail result (UI-facing shape).
 *
 * @typedef {Object} BomDetailResult
 * @property {{
 *   product: BomProductRecord,
 *   sku: BomSkuRecord,
 *   compliance: Object|null,
 *   bom: BomRecord
 * }} header
 * @property {BomItemRecord[]} details
 */

/**
 * @typedef {Object} MaterialBatchRecord
 * @property {string|null} materialBatchId
 * @property {string|null} materialName
 * @property {string|null} materialSnapshotName
 * @property {string|null} receivedLabelName
 * @property {string|null} lotNumber
 * @property {number}      batchQuantity
 * @property {number}      warehouseQuantity
 * @property {number}      reservedQuantity
 * @property {number}      availableQuantity
 * @property {string|null} inventoryStatus
 * @property {string|null} warehouseName
 * @property {string|null} supplierName
 * @property {string|null} inboundDate
 * @property {string|null} outboundDate
 * @property {string|null} lastUpdate
 */

/**
 * @typedef {Object} BOMPartSummary
 * @property {string}                partId
 * @property {string}                partName
 * @property {number}                requiredQtyPerUnit
 * @property {number}                totalAvailableQuantity
 * @property {number|null}           maxProducibleUnits
 * @property {boolean}               isShortage
 * @property {number}                shortageQty
 * @property {string|null}           packagingMaterialName
 * @property {string|null}           materialSnapshotName
 * @property {string|null}           displayLabel
 * @property {MaterialBatchRecord[]} materialBatches
 */
