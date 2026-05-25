/**
 * Type definitions for the outbound_shipments domain.
 *
 * Only types used by the tracking-attach flow are included here.
 * Other shipment types (list rows, list filters, etc.) live in the same file
 * but are documented alongside their own usage.
 */

/**
 * Raw row returned by GET_OUTBOUND_SHIPMENT_FOR_TRACKING_ATTACH.
 * Joins outbound_shipments + shipment_status + delivery_methods.
 *
 * @typedef {Object} OutboundShipmentTrackingAttachRow
 * @property {string} id                          - Outbound shipment UUID.
 * @property {string} shipment_id                 - Outbound shipment UUID.
 * @property {string} order_id                    - Parent order UUID.
 * @property {string} warehouse_id                - Warehouse UUID.
 * @property {string} delivery_method_id          - Delivery method UUID.
 * @property {string} status_id                   - Shipment status UUID.
 * @property {string} status_code                 - shipment_status.code.
 * @property {string} status_name                 - shipment_status.name.
 * @property {string} method_name                 - delivery_methods.method_name.
 * @property {string} delivery_method_name        - delivery_methods.method_name.
 * @property {boolean} is_pickup_location         - delivery_methods.is_pickup_location.
 * @property {boolean} requires_tracking_number   - delivery_methods.requires_tracking_number.
 */

/**
 * Delivery method subset returned alongside a shipment for tracking attach decisions.
 *
 * @typedef {Object} DeliveryMethodAttachContext
 * @property {string} id
 * @property {string} methodName
 * @property {boolean} isPickupLocation
 * @property {boolean} requiresTrackingNumber
 */

/**
 * Transformed shipment context consumed by the tracking-attach business layer.
 * Output of getOutboundShipmentForTrackingAttach.
 *
 * @typedef {Object} OutboundShipmentTrackingAttachContext
 * @property {string} id
 * @property {string} orderId
 * @property {string} warehouseId
 * @property {string} deliveryMethodId
 * @property {string} statusId
 * @property {string} statusCode
 * @property {string} statusName
 * @property {DeliveryMethodAttachContext} deliveryMethod
 */
