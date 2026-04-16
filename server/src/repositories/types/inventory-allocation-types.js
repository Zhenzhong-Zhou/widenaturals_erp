/**
 * @file inventory-allocation-types.js
 * @description Type definitions for inventory allocation repository, transformer,
 *              service, and controller layers.
 *
 * All IDs are UUIDs typed as strings. Raw row types mirror DB column names
 * (snake_case). Record types mirror transformed UI-facing shapes (camelCase).
 */

'use strict';

// ─── Raw DB Row Types ─────────────────────────────────────────────────────────

/**
 * One row from INVENTORY_ALLOCATION_BASE_QUERY.
 *
 * @typedef {Object} InventoryAllocationRow
 *
 * @property {string}      order_id
 * @property {string}      order_number
 * @property {string|null} order_type
 * @property {string|null} order_category
 * @property {string|null} order_status_name
 * @property {string|null} order_status_code
 *
 * @property {'individual'|'company'|null} customer_type
 * @property {string|null} customer_firstname
 * @property {string|null} customer_lastname
 * @property {string|null} customer_company_name
 *
 * @property {string|null} payment_method
 * @property {string|null} payment_status_name
 * @property {string|null} payment_status_code
 * @property {string|null} delivery_method
 *
 * @property {number|null} total_items
 * @property {number|null} allocated_items
 *
 * @property {string|null} allocated_at              ISO timestamp
 * @property {string|null} allocated_created_at      ISO timestamp
 * @property {string}      created_at                ISO timestamp
 * @property {string}      updated_at                ISO timestamp
 *
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 *
 * @property {string[]}    warehouse_ids             uuid[]
 * @property {string[]}    allocation_ids            uuid[]
 * @property {string|null} warehouse_names
 * @property {string[]}    allocation_status_codes
 * @property {string|null} allocation_statuses
 * @property {string}      allocation_summary_status
 */

/**
 * One row from INVENTORY_ALLOCATION_REVIEW_QUERY.
 *
 * @typedef {Object} InventoryAllocationReviewRow
 *
 * @property {string}      allocation_id
 * @property {string}      order_item_id
 * @property {string|null} transfer_order_item_id
 * @property {string|null} batch_id
 * @property {number}      allocated_quantity
 * @property {string|null} allocation_status_id
 * @property {string|null} allocation_status_name
 * @property {string|null} allocation_status_code
 * @property {string|null} allocation_created_at
 * @property {string|null} allocation_updated_at
 * @property {string|null} allocation_created_by
 * @property {string|null} allocation_created_by_firstname
 * @property {string|null} allocation_created_by_lastname
 * @property {string|null} allocation_updated_by
 * @property {string|null} allocation_updated_by_firstname
 * @property {string|null} allocation_updated_by_lastname
 *
 * @property {string}      order_id
 * @property {number}      quantity_ordered
 * @property {string|null} item_status_id
 * @property {string|null} item_status_name
 * @property {string|null} item_status_code
 * @property {string|null} item_status_date
 *
 * @property {string|null} sku_id
 * @property {string|null} sku
 * @property {string|null} barcode
 * @property {string|null} country_code
 * @property {string|null} size_label
 * @property {string|null} product_id
 * @property {string|null} product_name
 * @property {string|null} brand
 * @property {string|null} category
 *
 * @property {string|null} packaging_material_id
 * @property {string|null} packaging_material_code
 * @property {string|null} packaging_material_name
 * @property {string|null} packaging_material_color
 * @property {string|null} packaging_material_size
 * @property {string|null} packaging_material_unit
 * @property {number|null} packaging_material_length_cm
 * @property {number|null} packaging_material_width_cm
 * @property {number|null} packaging_material_height_cm
 *
 * @property {string}      order_number
 * @property {string|null} order_note
 * @property {string|null} order_type_id
 * @property {string|null} order_type_name
 * @property {string|null} order_status_id
 * @property {string|null} order_status_name
 * @property {string|null} order_status_code
 *
 * @property {string}      salesperson_id
 * @property {string|null} salesperson_firstname
 * @property {string|null} salesperson_lastname
 *
 * @property {'product'|'packaging_material'|null} batch_type
 * @property {?ProductBatchNested}                 product_batch
 * @property {?PackagingMaterialBatchNested}       packaging_material_batch
 */

/**
 * @typedef {Object} WarehouseInventoryNested
 * @property {string}      warehouse_inventory_id
 * @property {string|null} inbound_date
 * @property {number}      warehouse_quantity
 * @property {number}      reserved_quantity
 * @property {string|null} inventory_status_date
 * @property {string|null} inventory_status_name
 * @property {string|null} warehouse_name
 */

/**
 * @typedef {Object} ProductBatchNested
 * @property {string}      product_batch_id
 * @property {string|null} lot_number
 * @property {string|null} expiry_date
 * @property {string|null} manufacture_date
 * @property {WarehouseInventoryNested[]} warehouse_inventory
 */

/**
 * @typedef {Object} PackagingMaterialBatchNested
 * @property {string}      packaging_material_batch_id
 * @property {string|null} lot_number
 * @property {string|null} expiry_date
 * @property {string|null} manufacture_date
 * @property {string|null} material_snapshot_name
 * @property {WarehouseInventoryNested[]} warehouse_inventory
 */

// ─── Transformed Record Types ─────────────────────────────────────────────────

/**
 * @typedef {Object} UserName
 * @property {string|null} firstname
 * @property {string|null} lastname
 * @property {string}      fullName
 */

/**
 * @typedef {Object} UserRef
 * @property {string|null} id
 * @property {string}      fullName
 */

/**
 * @typedef {Object} CustomerSummary
 * @property {'individual'|'company'|null} type
 * @property {string|null} firstname
 * @property {string|null} lastname
 * @property {string|null} companyName
 * @property {string|null} customerName   Resolved: company_name for company rows,
 *                                        getFullName(firstname,lastname) otherwise.
 *                                        May be null if source fields are null.
 */

/**
 * @typedef {Object} InventoryAllocationSummary
 *
 * @property {string}      orderId
 * @property {string}      orderNumber
 * @property {string|null} [orderType]
 * @property {string|null} [orderCategory]
 * @property {{ name: string|null, code: string|null }} orderStatus
 * @property {CustomerSummary} customer
 * @property {string|null} [paymentMethod]
 * @property {{ name: string|null, code: string|null }} paymentStatus
 * @property {string|null} [deliveryMethod]
 *
 * @property {string}      [orderCreatedAt]
 * @property {UserName}    orderCreatedBy
 * @property {string}      [orderUpdatedAt]
 * @property {UserName}    orderUpdatedBy
 *
 * @property {{ total: number, allocated: number }} itemCount
 * @property {{ ids: string[], names: string }}     warehouses
 * @property {{ codes: string[], names: string, summary: string }} allocationStatus
 *
 * @property {string[]}    allocationIds
 * @property {string|null} [allocatedAt]
 * @property {string|null} [allocatedCreatedAt]
 */

/**
 * @typedef {Object} InventoryAllocationReviewHeader
 * @property {string}  orderNumber
 * @property {string|null} note
 * @property {{ id: string|null, name: string|null, code: string|null }} orderStatus
 * @property {UserRef} salesperson
 */

/**
 * @typedef {Object} InventoryAllocationBatchInfo
 * @property {'product'|'packaging_material'|'unknown'} type
 * @property {string} [lotNumber]
 * @property {string} [expiryDate]
 * @property {string} [manufactureDate]
 * @property {string} [snapshotName]
 */

/**
 * @typedef {Object} InventoryAllocationReviewItem
 * @property {string}      allocationId
 * @property {string}      orderItemId
 * @property {string|null} transferOrderItemId
 * @property {string|null} batchId
 * @property {number}      allocatedQuantity
 * @property {string|null} allocationStatusId
 * @property {string|null} allocationStatusName
 * @property {string|null} allocationStatusCode
 * @property {string|null} createdAt
 * @property {string|null} updatedAt
 * @property {UserRef}     createdBy
 * @property {UserRef}     updatedBy
 * @property {Object}      orderItem
 * @property {?Object}     product
 * @property {?Object}     packagingMaterial
 * @property {Array<Object>} warehouseInventoryList
 * @property {InventoryAllocationBatchInfo} batch
 */

/**
 * @typedef {Object} InventoryAllocationReviewResult
 * @property {InventoryAllocationReviewHeader} header
 * @property {InventoryAllocationReviewItem[]} items
 */

/**
 * @typedef {Object} InventoryAllocationFilterInput
 * @property {string[]} [statusIds]                 Filter by allocation status UUIDs (inner).
 * @property {string[]} [warehouseIds]              Filter by warehouse UUIDs (inner).
 * @property {string[]} [batchIds]                  Filter by batch UUIDs (inner).
 * @property {string}   [allocationCreatedBy]       Filter by allocation creator UUID (inner).
 * @property {string}   [allocatedAfter]            Lower bound for ia.allocated_at (inner, UTC ISO).
 * @property {string}   [allocatedBefore]           Upper bound for ia.allocated_at (inner, UTC ISO).
 * @property {string}   [aggregatedAllocatedAfter]  Lower bound for aa.allocated_at (outer, UTC ISO).
 * @property {string}   [aggregatedAllocatedBefore] Upper bound for aa.allocated_at (outer, UTC ISO).
 * @property {string}   [aggregatedCreatedAfter]    Lower bound for aa.allocated_created_at (outer, UTC ISO).
 * @property {string}   [aggregatedCreatedBefore]   Upper bound for aa.allocated_created_at (outer, UTC ISO).
 * @property {string}   [orderNumber]               ILIKE filter on order number (outer).
 * @property {string}   [orderStatusId]             Filter by order status UUID (outer).
 * @property {string}   [orderTypeId]               Filter by order type UUID (outer).
 * @property {string}   [orderCreatedBy]            Filter by order creator UUID (outer).
 * @property {string}   [paymentStatusId]           Filter by payment status UUID (outer).
 * @property {string}   [keyword]                   ILIKE search across order number, company name,
 *                                                  and customer full name (outer).
 */

/**
 * @typedef {Object} InventoryAllocationFilterOutput
 * @property {string}                     rawAllocWhereClause Inner-CTE WHERE clause (joined with AND).
 * @property {Array<string|string[]>}     rawAllocParams      Inner-CTE params (UUIDs, UUID arrays, timestamps).
 * @property {string}                     outerWhereClause    Outer-query WHERE clause (joined with AND).
 * @property {Array<string|string[]>}     outerParams         Outer-query params.
 */
