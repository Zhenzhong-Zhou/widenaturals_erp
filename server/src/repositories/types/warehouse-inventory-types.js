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

/**
 * @typedef {object} WarehouseInventoryRow
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
 * @typedef {object} WarehouseInventoryRecord
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
 * @property {object}      status
 * @property {object}      productInfo
 * @property {object}      packagingInfo
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
 * @property {string} id
 * @property {number} warehouseQuantity
 * @property {number} reservedQuantity
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
