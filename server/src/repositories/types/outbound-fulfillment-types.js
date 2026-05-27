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
 * Tracking columns come from a LATERAL subquery exposing the primary
 * (oldest) tracking number per shipment plus a total tracking_count.
 * Shipments with no tracking have tracking_number / carrier as null
 * and tracking_count as '0'.
 *
 * @typedef {Object} OutboundShipmentRow
 *
 * — Shipment / order / warehouse —
 * @property {string}      shipment_id
 * @property {string}      order_id
 * @property {string}      order_number
 * @property {string}      warehouse_id
 * @property {string|null} warehouse_name
 *
 * — Delivery method —
 * @property {string|null} delivery_method_id
 * @property {string|null} delivery_method
 * @property {boolean}     requires_tracking_number
 *
 * — Tracking (LATERAL primary + count) —
 * @property {string|null} tracking_number
 * @property {string|null} carrier
 * @property {string}      tracking_count      - String from COUNT() — parseInt in transformer.
 *
 * — Status —
 * @property {string}      status_id
 * @property {string}      status_code
 * @property {string}      status_name
 *
 * — Dates / details —
 * @property {string|null} shipped_at
 * @property {string|null} expected_delivery_date
 * @property {string|null} notes
 * @property {Object|null} shipment_details
 *
 * — Audit —
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
 * Tracking numbers are aggregated into a single jsonb array via a LATERAL
 * subquery — they do NOT fan out into separate rows. The same
 * tracking_numbers array repeats on every row of the fulfillment × batch
 * fan-out (and is identical across them); read it from rows[0].
 *
 * Fulfillment and shipment batch fields still fan out — one row per
 * fulfillment × batch combination — and are grouped by fulfillment_id
 * in the transformer.
 *
 * @typedef {Object} TrackingNumberDetail
 * @property {string}      id
 * @property {string|null} tracking_number
 * @property {string}      carrier
 * @property {string|null} service_name
 * @property {string|null} bol_number
 * @property {string|null} freight_type
 * @property {string|null} shipped_date
 * @property {string}      status_id
 * @property {string|null} status_name
 * @property {string|null} notes
 * @property {string}      created_at
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
 * @property {boolean}     delivery_method_requires_tracking
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
 * — Tracking (LATERAL jsonb aggregation) —
 * @property {TrackingNumberDetail[]|null} tracking_numbers
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

/**
 * @typedef {Object} AdjustedFulfillmentResult
 * @description Return shape of confirmOutboundFulfillmentService.
 *
 * @property {{ id: string, number: string }} order
 *   Order identity — UUID and human-readable order number.
 *
 * @property {{ id: string, statuses: Array<StatusTransitionRow> }} shipment
 *   Shipment identity and the status transition rows produced for it.
 *
 * @property {Array<{ id: string, statusId: string }>} fulfillments
 *   Lightweight fulfillment summary — UUID + pre-transition status ID per row.
 *
 * @property {{ updatedWarehouseIds: Array<string> }} inventory
 *   IDs of warehouse_inventory rows whose reserved/warehouse quantities
 *   were adjusted during confirmation.
 *
 * @property {AdjustedFulfillmentStatusBundle} statuses
 *   Status transition rows grouped by entity.
 *
 * @property {Array<InventoryActivityLogRow>} logs
 *   Inventory activity log rows written under the 'fulfilled' action type.
 */

/**
 * @typedef {Object} AdjustedFulfillmentStatusBundle
 * @property {StatusTransitionRow} order
 * @property {Array<StatusTransitionRow>} orderItems
 * @property {Array<StatusTransitionRow>} allocations
 * @property {Array<StatusTransitionRow>} fulfillments
 * @property {Array<StatusTransitionRow>} shipments
 */

/**
 * @typedef {Object} StatusTransitionRow
 * @property {string} id - UUID of the affected row (order, item, allocation, fulfillment, or shipment).
 * @property {string} status_id - New status UUID applied.
 * @property {Date}   status_date - Timestamp the transition was recorded.
 */

/**
 * @typedef {Object} FulfillmentRow
 * @description Row shape returned by getOrderFulfillments — order_fulfillments
 * joined with fulfillment_status for inline code lookup. Consumed by order
 * target resolvers and confirm/complete service flows.
 *
 * @property {string} fulfillment_id - UUID of the fulfillment.
 * @property {string} order_id - UUID of the parent order (derived via order_items join).
 * @property {string} order_item_id - UUID of the order item this fulfillment is against.
 * @property {string} allocation_id - UUID of the inventory allocation backing this fulfillment.
 * @property {number} quantity_fulfilled - Quantity fulfilled in this row.
 * @property {string} status_id - UUID of the current fulfillment_status.
 * @property {FulfillmentStatusCode} status_code - Code of the current fulfillment_status, joined from the lookup table.
 * @property {string} shipment_id - UUID of the outbound_shipment this fulfillment belongs to.
 * @property {string|null} fulfillment_notes - Optional notes captured at create or update.
 * @property {Date|null} fulfilled_at - When the fulfillment was completed (null until completion).
 * @property {Date} created_at - Row creation timestamp.
 * @property {Date} updated_at - Row last update timestamp.
 * @property {string|null} fulfilled_by - User UUID who marked it fulfilled (null until completion).
 * @property {string} created_by - User UUID who created the row.
 * @property {string|null} updated_by - User UUID who last updated the row.
 */
