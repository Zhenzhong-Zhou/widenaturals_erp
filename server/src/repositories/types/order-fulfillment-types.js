/**
 * @file order-fulfillment-types.js
 * @description Typedefs for order fulfillment query result shapes.
 *
 * Produced by ORDER_GET_FULFILLMENTS_QUERY (or wherever the join lives).
 * Consumed by outbound-fulfillment-business.js and updateAllStatuses
 * orchestrator.
 */

/**
 * @typedef {Object} OrderFulfillmentRow
 * @property {string} fulfillment_id      - UUID of the order_fulfillments row.
 * @property {string} order_id            - UUID of the parent order (from joined order_items).
 * @property {string} order_item_id       - UUID of the order item this fulfillment satisfies.
 * @property {string} allocation_id       - UUID of the inventory allocation backing this fulfillment.
 * @property {number} quantity_fulfilled  - Units fulfilled by this row.
 * @property {string} status_id           - UUID of the fulfillment_status row.
 * @property {string} status_code         - Canonical fulfillment status code (e.g. 'FULFILLMENT_PENDING').
 * @property {string} shipment_id         - UUID of the outbound shipment carrying this fulfillment.
 */
