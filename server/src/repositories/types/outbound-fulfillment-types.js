/**
 * @file outbound-fulfillment-types.js
 * @description JSDoc typedefs for the outbound fulfillment domain.
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
 * Raw DB row returned by the paginated outbound shipment query.
 *
 * @typedef {Object} OutboundShipmentRow
 * @property {string}      shipment_id
 * @property {string}      order_id
 * @property {string}      order_number
 * @property {string}      warehouse_id
 * @property {string|null} warehouse_name
 * @property {string|null} delivery_method_id
 * @property {string|null} delivery_method
 * @property {string|null} tracking_number_id
 * @property {string|null} tracking_number
 * @property {string}      status_id
 * @property {string}      status_code
 * @property {string}      status_name
 * @property {string|null} shipped_at
 * @property {string|null} expected_delivery_date
 * @property {string|null} notes
 * @property {Object|null} shipment_details
 * @property {string}      created_at
 * @property {string}      created_by
 * @property {string|null} created_by_firstname
 * @property {string|null} created_by_lastname
 * @property {string|null} updated_at
 * @property {string|null} updated_by
 * @property {string|null} updated_by_firstname
 * @property {string|null} updated_by_lastname
 */

/**
 * Raw DB row returned by the shipment detail query.
 *
 * One row per shipment batch. Fulfillment and shipment header fields
 * repeat across rows — grouped by fulfillment_id in the transformer.
 *
 * @typedef {Object} ShipmentDetailRow
 *
 * — Shipment header —
 * @property {string}      shipment_id
 * @property {string}      order_id
 * @property {string}      warehouse_id
 * @property {string|null} warehouse_name
 * @property {string|null} delivery_method_id
 * @property {string|null} delivery_method_name
 * @property {boolean|null} delivery_method_is_pickup
 * @property {string|null} delivery_method_estimated_time
 * @property {string}      shipment_status_id
 * @property {string}      shipment_status_code
 * @property {string}      shipment_status_name
 * @property {string|null} shipped_at
 * @property {string|null} expected_delivery_date
 * @property {string|null} shipment_notes
 * @property {Object|null} shipment_details
 * @property {string}      created_at
 * @property {string}      created_by
 * @property {string|null} shipment_created_by_firstname
 * @property {string|null} shipment_created_by_lastname
 * @property {string|null} updated_at
 * @property {string|null} updated_by
 * @property {string|null} shipment_updated_by_firstname
 * @property {string|null} shipment_updated_by_lastname
 *
 * — Tracking —
 * @property {string|null} tracking_id
 * @property {string|null} tracking_number
 * @property {string|null} carrier
 * @property {string|null} service_name
 * @property {string|null} bol_number
 * @property {string|null} freight_type
 * @property {string|null} tracking_notes
 * @property {string|null} tracking_shipped_date
 * @property {string|null} tracking_status_id
 * @property {string|null} tracking_status_name
 *
 * — Fulfillment —
 * @property {string|null} fulfillment_id
 * @property {number|null} quantity_fulfilled
 * @property {string|null} fulfilled_at
 * @property {string|null} fulfillment_notes
 * @property {string|null} fulfillment_status_id
 * @property {string|null} fulfillment_status_code
 * @property {string|null} fulfillment_status_name
 * @property {string|null} fulfillment_created_at
 * @property {string|null} fulfillment_created_by
 * @property {string|null} fulfillment_created_by_firstname
 * @property {string|null} fulfillment_created_by_lastname
 * @property {string|null} fulfillment_updated_at
 * @property {string|null} fulfillment_updated_by
 * @property {string|null} fulfillment_updated_by_firstname
 * @property {string|null} fulfillment_updated_by_lastname
 * @property {string|null} fulfilled_by
 * @property {string|null} fulfillment_fulfilled_by_firstname
 * @property {string|null} fulfillment_fulfilled_by_lastname
 *
 * — Order item —
 * @property {string|null} order_item_id
 * @property {number|null} quantity_ordered
 * @property {string|null} sku_id
 * @property {string|null} sku
 * @property {string|null} barcode
 * @property {string|null} size_label
 * @property {string|null} market_region
 * @property {string|null} product_id
 * @property {string|null} product_name
 * @property {string|null} brand
 * @property {string|null} category
 * @property {string|null} country_code
 * @property {string|null} packaging_material_id
 * @property {string|null} packaging_material_code
 * @property {string|null} packaging_material_name
 * @property {string|null} packaging_material_size
 * @property {string|null} packaging_material_color
 * @property {string|null} packaging_material_unit
 * @property {number|null} packaging_material_length_cm
 * @property {number|null} packaging_material_width_cm
 * @property {number|null} packaging_material_height_cm
 * @property {string|null} material_snapshot_name
 *
 * — Shipment batch —
 * @property {string|null} shipment_batch_id
 * @property {number|null} quantity_shipped
 * @property {string|null} shipment_batch_notes
 * @property {string|null} shipment_batch_created_at
 * @property {string|null} shipment_batch_created_by
 * @property {string|null} shipment_batch_created_by_firstname
 * @property {string|null} shipment_batch_created_by_lastname
 * @property {string|null} batch_registry_id
 * @property {string|null} batch_type
 * @property {string|null} product_lot_number
 * @property {string|null} product_expiry_date
 * @property {string|null} material_lot_number
 * @property {string|null} material_expiry_date
 */

/**
 * Raw DB row returned by `getShipmentByShipmentId`.
 *
 * @typedef {Object} ShipmentRow
 * @property {string}       shipment_id
 * @property {string}       order_id
 * @property {string|null}  status_code
 * @property {string|null}  status_id
 * @property {string|null}  delivery_method_name
 * @property {boolean|null} is_pickup_location
 * @property {string|null}  order_number
 * @property {string|null}  delivery_method_id
 */

// ---------------------------------------------------------------------------
// Record types (UI-facing shapes)
// ---------------------------------------------------------------------------

/**
 * Transformed paginated outbound shipment record.
 *
 * @typedef {Object} OutboundShipmentRecord
 * @property {string}      shipmentId
 * @property {{ id: string, number: string }} order
 * @property {{ id: string, name: string|null }} warehouse
 * @property {{ id: string|null, name: string|null }|null} deliveryMethod
 * @property {{ id: string|null, number: string|null }|null} trackingNumber
 * @property {{ id: string, code: string, name: string }} status
 * @property {{ shippedAt: string|null, expectedDelivery: string|null }} dates
 * @property {string|null} notes
 * @property {Object|null} shipmentDetails
 * @property {Object}      audit
 */

/**
 * Transformed minimal fulfillment creation result.
 *
 * @typedef {Object} FulfillmentResult
 * @property {string}   orderId
 * @property {{ id: string|null, updatedAt: string|null }} orderStatus
 * @property {{ id: string|null, batchId: string|null }} shipment
 * @property {{ id: string|null, statusId: string|null }} fulfillment
 * @property {{ updatedOrderItemStatusIds: string[] }} statusUpdates
 */
