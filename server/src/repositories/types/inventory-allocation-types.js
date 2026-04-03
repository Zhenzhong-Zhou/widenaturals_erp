/**
 * @file inventory-allocation-types.js
 * @description JSDoc typedefs for the inventory allocation domain.
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
 * Raw DB row returned by `getOrderItemsByOrderId`.
 *
 * @typedef {Object} OrderItemMetadataRow
 * @property {string}      order_item_id
 * @property {string}      order_id
 * @property {string|null} sku_id
 * @property {string|null} packaging_material_id
 * @property {string}      order_item_code
 * @property {string|null} order_item_status_id
 * @property {number}      quantity_ordered
 */

/**
 * Raw DB row returned by the inventory allocation review query.
 *
 * @typedef {Object} InventoryAllocationReviewRow
 * @property {string}      allocation_id
 * @property {string}      order_item_id
 * @property {string|null} transfer_order_item_id
 * @property {string}      batch_id
 * @property {number}      allocated_quantity
 * @property {string}      allocation_status_id
 * @property {string}      allocation_status_name
 * @property {string}      allocation_status_code
 * @property {string}      allocation_created_at
 * @property {string}      allocation_updated_at
 * @property {string}      allocation_created_by
 * @property {string}      allocation_created_by_firstname
 * @property {string}      allocation_created_by_lastname
 * @property {string}      allocation_updated_by
 * @property {string}      allocation_updated_by_firstname
 * @property {string}      allocation_updated_by_lastname
 * @property {string}      order_id
 * @property {string}      quantity_ordered
 * @property {string}      item_status_id
 * @property {string}      item_status_name
 * @property {string}      item_status_code
 * @property {string}      item_status_date
 * @property {string|null} sku_id
 * @property {string|null} sku
 * @property {string|null} barcode
 * @property {string|null} country_code
 * @property {string|null} size_label
 * @property {string|null} product_id
 * @property {string|null} product_name
 * @property {string|null} brand
 * @property {string|null} category
 * @property {string|null} packaging_material_id
 * @property {string|null} packaging_material_code
 * @property {string|null} packaging_material_name
 * @property {string|null} packaging_material_color
 * @property {string|null} packaging_material_size
 * @property {string|null} packaging_material_unit
 * @property {number|null} packaging_material_length_cm
 * @property {number|null} packaging_material_width_cm
 * @property {number|null} packaging_material_height_cm
 * @property {string}      order_number
 * @property {string}      order_status_id
 * @property {string}      order_status_name
 * @property {string}      order_status_code
 * @property {string|null} order_note
 * @property {string}      salesperson_id
 * @property {string}      salesperson_firstname
 * @property {string}      salesperson_lastname
 * @property {string|null} warehouse_inventory_id
 * @property {number|null} warehouse_quantity
 * @property {number|null} reserved_quantity
 * @property {string|null} inventory_status_name
 * @property {string|null} inventory_status_date
 * @property {string}      batch_type
 * @property {string|null} product_lot_number
 * @property {string|null} product_expiry_date
 * @property {string|null} product_inbound_date
 * @property {string|null} material_lot_number
 * @property {string|null} material_expiry_date
 * @property {string|null} material_name
 */

/**
 * Raw DB row returned by the paginated inventory allocation query.
 *
 * @typedef {Object} InventoryAllocationRow
 * @property {string}        order_id
 * @property {string}        order_number
 * @property {string|null}   order_type
 * @property {string|null}   order_category
 * @property {string|null}   order_status_name
 * @property {string|null}   order_status_code
 * @property {string|null}   customer_firstname
 * @property {string|null}   customer_lastname
 * @property {string|null}   payment_method
 * @property {string|null}   payment_status_name
 * @property {string|null}   payment_status_code
 * @property {string|null}   delivery_method
 * @property {string}        created_at
 * @property {string|null}   updated_at
 * @property {string|null}   created_by_firstname
 * @property {string|null}   created_by_lastname
 * @property {string|null}   updated_by_firstname
 * @property {string|null}   updated_by_lastname
 * @property {number|null}   total_items
 * @property {number|null}   allocated_items
 * @property {string[]|null} warehouse_ids
 * @property {string|null}   warehouse_names
 * @property {string[]|null} allocation_status_codes
 * @property {string|null}   allocation_statuses
 * @property {string|null}   allocation_summary_status
 * @property {string[]|null} allocation_ids
 * @property {string|null}   allocated_at
 * @property {string|null}   allocated_created_at
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} BatchData
 * @property {string|null} [lot_number]
 * @property {string|null} [expiry_date]
 * @property {string|null} [manufacture_date]
 * @property {Array}       [warehouse_inventory]
 * @property {string|null} [material_snapshot_name]
 */

/**
 * Transformed paginated inventory allocation summary record.
 *
 * @typedef {Object} InventoryAllocationSummary
 * @property {string}      orderId
 * @property {string}      orderNumber
 * @property {string|null} orderType
 * @property {string|null} orderCategory
 * @property {{ name: string|null, code: string|null }} orderStatus
 * @property {{ fullName: string|null }} customer
 * @property {string|null} paymentMethod
 * @property {{ name: string|null, code: string|null }} paymentStatus
 * @property {string|null} deliveryMethod
 * @property {string}      orderCreatedAt
 * @property {string|null} orderCreatedBy
 * @property {string|null} orderUpdatedAt
 * @property {string|null} orderUpdatedBy
 * @property {{ total: number, allocated: number }} itemCount
 * @property {{ ids: string[], names: string }} warehouses
 * @property {{
 *   codes: string[],
 *   names: string,
 *   summary: string|null
 * }} allocationStatus
 * @property {string[]}    allocationIds
 * @property {string|null} allocatedAt
 * @property {string|null} allocatedCreatedAt
 */
