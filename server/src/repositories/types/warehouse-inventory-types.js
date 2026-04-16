/**
 * @typedef {object} WarehouseInventoryFilters
 * @property {string}  warehouseId
 * @property {string}  [statusId]
 * @property {string}  [batchType]
 * @property {string}  [skuId]
 * @property {string}  [productId]
 * @property {string}  [packagingMaterialId]
 * @property {string}  [inboundDateAfter]
 * @property {string}  [inboundDateBefore]
 * @property {boolean} [hasReserved]
 * @property {string}  [search]
 * @property {boolean} [forceEmptyResult]
 */

// ─── Transformer Output Types ─────────────────────────────────────────────────

/**
 * @typedef {Object} WarehouseInventoryStatus
 * @property {string}      id
 * @property {string}      name
 * @property {string|null} date
 */

/**
 * @typedef {Object} WarehouseInventoryBase
 * @property {string}                    id
 * @property {string}                    batchId
 * @property {string}                    batchType
 * @property {number}                    warehouseQuantity
 * @property {number}                    reservedQuantity
 * @property {number}                    availableQuantity
 * @property {string}                    warehouseFee
 * @property {string|null}              inboundDate
 * @property {string|null}              outboundDate
 * @property {string|null}              lastMovementAt
 * @property {WarehouseInventoryStatus}  status
 */

/**
 * @typedef {Object} ProductBatchInfo
 * @property {string}      id
 * @property {string}      lotNumber
 * @property {string|null} expiryDate
 */

/**
 * @typedef {Object} SkuInfo
 * @property {string}      id
 * @property {string}      sku
 * @property {string|null} barcode
 * @property {string|null} sizeLabel
 * @property {string|null} countryCode
 * @property {string|null} marketRegion
 */

/**
 * @typedef {Object} ProductDetail
 * @property {string}      id
 * @property {string}      name
 * @property {string|null} brand
 */

/**
 * @typedef {Object} ManufacturerInfo
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} ProductInfo
 * @property {ProductBatchInfo}  batch
 * @property {SkuInfo}           sku
 * @property {ProductDetail}     product
 * @property {ManufacturerInfo}  manufacturer
 */

/**
 * @typedef {Object} PackagingBatchInfo
 * @property {string}      id
 * @property {string}      lotNumber
 * @property {string|null} displayName
 * @property {string|null} expiryDate
 */

/**
 * @typedef {Object} PackagingMaterialInfo
 * @property {string} id
 * @property {string} code
 */

/**
 * @typedef {Object} SupplierInfo
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} PackagingInfo
 * @property {PackagingBatchInfo}     batch
 * @property {PackagingMaterialInfo}  material
 * @property {SupplierInfo}           supplier
 */

/**
 * @typedef {WarehouseInventoryBase & { batchType: 'product', productInfo: ProductInfo, packagingInfo: null }} ProductWarehouseInventoryRecord
 */

/**
 * @typedef {WarehouseInventoryBase & { batchType: 'packaging_material', productInfo: null, packagingInfo: PackagingInfo }} PackagingWarehouseInventoryRecord
 */

/**
 * @typedef {WarehouseInventoryBase & { batchType: string, productInfo: null, packagingInfo: null }} UnknownWarehouseInventoryRecord
 */

/**
 * @typedef {ProductWarehouseInventoryRecord | PackagingWarehouseInventoryRecord | UnknownWarehouseInventoryRecord} WarehouseInventoryRecord
 */

/**
 * @typedef {object} WarehouseInventoryRow
 * @property {string}      id
 * @property {string}      batch_id
 * @property {string}      batch_type
 * @property {number}      warehouse_quantity
 * @property {number}      reserved_quantity
 * @property {number}      available_quantity
 * @property {string}      warehouse_fee
 * @property {string}      inbound_date
 * @property {string|null} outbound_date
 * @property {string|null} last_movement_at
 * @property {string}      status_id
 * @property {string}      status_date
 * @property {string}      status_name
 * @property {string|null} product_batch_id
 * @property {string|null} product_lot_number
 * @property {string|null} product_expiry_date
 * @property {string|null} sku_id
 * @property {string|null} sku
 * @property {string|null} barcode
 * @property {string|null} size_label
 * @property {string|null} country_code
 * @property {string|null} market_region
 * @property {string|null} product_id
 * @property {string|null} product_name
 * @property {string|null} brand
 * @property {string|null} manufacturer_id
 * @property {string|null} manufacturer_name
 * @property {string|null} packaging_batch_id
 * @property {string|null} packaging_lot_number
 * @property {string|null} packaging_display_name
 * @property {string|null} packaging_expiry_date
 * @property {string|null} packaging_material_id
 * @property {string|null} packaging_material_code
 * @property {string|null} supplier_id
 * @property {string|null} supplier_name
 */

/**
 * @typedef {object} WarehouseInventoryInsertRecord
 * @property {string}      warehouse_id
 * @property {string}      batch_id
 * @property {number}      warehouse_quantity
 * @property {number}      [reserved_quantity=0]
 * @property {number}      [warehouse_fee=0]
 * @property {string}      inbound_date
 * @property {string}      status_id
 * @property {string|null} [status_date]
 * @property {string|null} [created_by]
 */

/**
 * @typedef {object} WarehouseInventoryQuantityUpdate
 * @property {string}      id                - warehouse_inventory row UUID
 * @property {number}      warehouseQuantity  - updated warehouse quantity
 * @property {number}      reservedQuantity   - updated reserved quantity
 * @property {string}      statusId           - inventory status UUID (in-stock or out-of-stock)
 * @property {string}      [warehouseId]      - warehouse UUID — required for adjust quantity API, omitted for allocation confirm
 */

/**
 * @typedef {object} WarehouseInventoryStatusUpdate
 * @property {string} id
 * @property {string} statusId
 */

/**
 * @typedef {object} WarehouseInventoryMetadataUpdate
 * @property {string} id
 * @property {string} warehouseId
 * @property {string} [inboundDate]
 * @property {number} [warehouseFee]
 * @property {string} updatedBy
 */

/**
 * @typedef {object} WarehouseInventoryOutboundUpdate
 * @property {string} id
 * @property {string} outboundDate
 * @property {number} warehouseQuantity
 */

/**
 * @typedef {object} WarehouseInventoryDetailRow
 * @property {string}      id
 * @property {string}      batch_id
 * @property {string}      batch_type
 * @property {number}      warehouse_quantity
 * @property {number}      reserved_quantity
 * @property {number}      available_quantity
 * @property {number}      warehouse_fee
 * @property {string}      inbound_date
 * @property {string|null} outbound_date
 * @property {string|null} last_movement_at
 * @property {string}      status_id
 * @property {string}      status_date
 * @property {string}      status_name
 * @property {string}      batch_type
 * @property {string}      registered_at
 * @property {string|null} batch_note
 * @property {string|null} product_batch_id
 * @property {string|null} product_lot_number
 * @property {string|null} product_expiry_date
 * @property {string|null} product_manufacture_date
 * @property {number|null} product_initial_quantity
 * @property {string|null} product_batch_notes
 * @property {string|null} sku_id
 * @property {string|null} sku
 * @property {string|null} barcode
 * @property {string|null} size_label
 * @property {string|null} country_code
 * @property {string|null} market_region
 * @property {string|null} product_id
 * @property {string|null} product_name
 * @property {string|null} brand
 * @property {string|null} category
 * @property {string|null} series
 * @property {string|null} displayName
 * @property {string|null} manufacturer_id
 * @property {string|null} manufacturer_name
 * @property {string|null} packaging_batch_id
 * @property {string|null} packaging_lot_number
 * @property {string|null} packaging_display_name
 * @property {string|null} packaging_expiry_date
 * @property {number|null} packaging_initial_quantity
 * @property {string|null} packaging_unit
 * @property {string|null} packaging_material_id
 * @property {string|null} packaging_material_code
 * @property {string|null} packaging_material_name
 * @property {string|null} packaging_material_category
 * @property {string|null} supplier_id
 * @property {string|null} supplier_name
 * @property {string}      created_by
 * @property {string}      created_at
 * @property {string|null} updated_by
 * @property {string|null} updated_at
 * @property {string}      created_by_firstname
 * @property {string}      created_by_lastname
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 */

/**
 * @typedef {object} WarehouseInventoryDetailRecord
 * @property {string}      id
 * @property {string}      batchId
 * @property {string}      batchType
 * @property {number}      warehouseQuantity
 * @property {number}      reservedQuantity
 * @property {number}      availableQuantity
 * @property {number}      warehouseFee
 * @property {string}      inboundDate
 * @property {string|null} outboundDate
 * @property {string|null} lastMovementAt
 * @property {string}      registeredAt
 * @property {string|null} batchNote
 * @property {object}      status
 * @property {object|null} productInfo
 * @property {object|null} packagingInfo
 * @property {object}      audit
 */

/**
 * @typedef {object} WarehouseSummaryRow
 * @property {string} warehouse_id
 * @property {string} warehouse_name
 * @property {string} warehouse_code
 * @property {number|null} storage_capacity
 * @property {number|null} default_fee
 * @property {string|null} warehouse_type_name
 * @property {string} total_batches
 * @property {string} total_product_skus
 * @property {string} total_packaging_materials
 * @property {string} total_quantity
 * @property {string} total_reserved
 * @property {string} total_available
 * @property {string} product_quantity
 * @property {string} packaging_quantity
 * @property {string} product_batch_count
 * @property {string} packaging_batch_count
 */

/**
 * @typedef {object} WarehouseSummaryByStatusRow
 * @property {string} status_id
 * @property {string} status_name
 * @property {string} batch_count
 * @property {string} total_quantity
 * @property {string} total_reserved
 * @property {string} total_available
 */

/**
 * @typedef {object} WarehouseProductSummaryRow
 * @property {string}      product_id
 * @property {string}      product_name
 * @property {string|null} brand
 * @property {string}      sku_id
 * @property {string}      sku
 * @property {string|null} size_label
 * @property {string|null} country_code
 * @property {string|null} market_region
 * @property {string}      batch_count
 * @property {string}      total_quantity
 * @property {string}      total_reserved
 * @property {string}      total_available
 * @property {string|null} earliest_expiry
 */

/**
 * @typedef {object} WarehousePackagingSummaryRow
 * @property {string}      packaging_material_id
 * @property {string}      packaging_material_code
 * @property {string}      packaging_material_name
 * @property {string|null} packaging_material_category
 * @property {string}      batch_count
 * @property {string}      total_quantity
 * @property {string}      total_reserved
 * @property {string}      total_available
 * @property {string|null} earliest_expiry
 */

/**
 * @typedef {object} WarehouseInventoryQuantityRow
 * @property {string} id
 * @property {string} warehouse_id
 * @property {string} batch_id
 * @property {number} warehouse_quantity
 * @property {number} reserved_quantity
 * @property {string} status_id
 */

/**
 * @typedef {object} AllocatableBatchRow
 * @property {string} warehouse_inventory_id
 * @property {string} batch_id
 * @property {string} warehouse_id
 * @property {string} warehouse_name
 * @property {number} warehouse_quantity
 * @property {number} reserved_quantity
 * @property {string|null} expiry_date
 * @property {string|null} lot_number
 * @property {string|null} inbound_date
 * @property {string} batch_type
 * @property {string|null} sku_id
 * @property {string|null} packaging_material_id
 */

/**
 * @typedef {object} SkuHasInventoryRow
 * @property {1} '?column?'
 */
