/**
 * @file order-types.js
 * @description JSDoc typedefs for the order domain.
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
 * Raw DB row returned by the paginated orders query.
 *
 * @typedef {Object} OrderRow
 * @property {string}      id
 * @property {string}      order_number
 * @property {string|null} order_type
 * @property {string|null} order_status_code
 * @property {string|null} order_status_name
 * @property {string|null} order_date
 * @property {string|null} status_date
 * @property {string|null} created_at
 * @property {string|null} updated_at
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 * @property {string|null} note
 * @property {string|null} customer_firstname
 * @property {string|null} customer_lastname
 * @property {string|null} payment_method
 * @property {string|null} payment_status_name
 * @property {string|null} payment_status_code
 * @property {string|null} delivery_method
 * @property {number}      number_of_items
 */

/**
 * Raw DB row returned by the order detail query (header).
 *
 * @typedef {Object} OrderDetailRow
 * @property {string}      order_id
 * @property {string}      order_number
 * @property {string|null} order_date
 * @property {string|null} status_date
 * @property {string|null} note
 * @property {string|null} order_type_id
 * @property {string|null} order_type_name
 * @property {string|null} order_status_id
 * @property {string|null} order_status_name
 * @property {string|null} order_status_code
 * @property {string|null} customer_id
 * @property {string|null} customer_firstname
 * @property {string|null} customer_lastname
 * @property {string|null} customer_email
 * @property {string|null} customer_phone
 * @property {string|null} payment_status_id
 * @property {string|null} payment_status_name
 * @property {string|null} payment_status_code
 * @property {string|null} payment_method_id
 * @property {string|null} payment_method_name
 * @property {string|null} currency_code
 * @property {number|null} exchange_rate
 * @property {number|null} base_currency_amount
 * @property {string|null} discount_id
 * @property {string|null} discount_name
 * @property {string|null} discount_type
 * @property {number|null} discount_value
 * @property {number|null} discount_amount
 * @property {number|null} subtotal
 * @property {string|null} tax_rate_id
 * @property {string|null} tax_rate_name
 * @property {number|null} tax_rate_percent
 * @property {string|null} tax_rate_province
 * @property {string|null} tax_rate_region
 * @property {number|null} tax_amount
 * @property {number|null} shipping_fee
 * @property {number|null} total_amount
 * @property {string|null} delivery_method_id
 * @property {string|null} delivery_method_name
 * @property {Object|null} sales_order_metadata
 * @property {string|null} order_created_at
 * @property {string|null} order_created_by
 * @property {string|null} order_created_by_firstname
 * @property {string|null} order_created_by_lastname
 * @property {string|null} order_updated_at
 * @property {string|null} order_updated_by
 * @property {string|null} order_updated_by_firstname
 * @property {string|null} order_updated_by_lastname
 */

/**
 * Raw DB row returned by the order items query.
 *
 * @typedef {Object} OrderItemRow
 * @property {string}      order_item_id
 * @property {string}      order_id
 * @property {number}      quantity_ordered
 * @property {string|null} price_id
 * @property {number|null} listed_price
 * @property {string|null} price_type_name
 * @property {number|null} item_price
 * @property {number|null} item_subtotal
 * @property {string|null} item_status_id
 * @property {string|null} item_status_name
 * @property {string|null} item_status_code
 * @property {string|null} item_status_date
 * @property {Object|null} item_metadata
 * @property {string|null} sku_id
 * @property {string|null} sku
 * @property {string|null} barcode
 * @property {string|null} brand
 * @property {string|null} country_code
 * @property {string|null} product_name
 * @property {string|null} size_label
 * @property {string|null} packaging_material_id
 * @property {string|null} packaging_material_code
 * @property {string|null} packaging_material_name
 * @property {string|null} packaging_material_size
 * @property {string|null} packaging_material_color
 * @property {string|null} packaging_material_unit
 * @property {number|null} packaging_material_length_cm
 * @property {number|null} packaging_material_width_cm
 * @property {number|null} packaging_material_height_cm
 * @property {string|null} item_created_at
 * @property {string|null} item_created_by
 * @property {string|null} item_created_by_firstname
 * @property {string|null} item_created_by_lastname
 * @property {string|null} item_updated_at
 * @property {string|null} item_updated_by
 * @property {string|null} item_updated_by_firstname
 * @property {string|null} item_updated_by_lastname
 */

/**
 * @typedef {object} OrderMetadataRow
 * @property {string} order_id
 * @property {string} order_status_id
 * @property {string} order_status_category
 * @property {string} order_status_code
 * @property {string} order_status_name
 * @property {string} order_type_id
 * @property {string} order_type_code
 * @property {string} order_type_name
 * @property {string} order_category
 * @property {string | null} payment_code
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed paginated order row for table view.
 *
 * @typedef {Object} OrderRecord
 * @property {string}      id
 * @property {string}      orderNumber
 * @property {string|null} orderType
 * @property {{ code: string|null, name: string|null }} orderStatus
 * @property {string|null} orderDate
 * @property {string|null} statusDate
 * @property {string|null} createdAt
 * @property {string|null} createdBy
 * @property {string|null} updatedAt
 * @property {string|null} updatedBy
 * @property {string|null} note
 * @property {string|null} customerName
 * @property {string|null} paymentMethod
 * @property {{ name: string|null, code: string|null }} paymentStatus
 * @property {string|null} deliveryMethod
 * @property {number}      numberOfItems
 */
