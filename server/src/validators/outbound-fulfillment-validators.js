const Joi = require('joi');
const { validateOptionalString, validateUUIDArray, validateString } = require('./general-validators');

/**
 * Joi schema: fulfillOutboundShipmentBodySchema
 *
 * Validates the request body for initiating an outbound shipment fulfillment.
 *
 * Structure:
 *  {
 *    allocations: {
 *      ids: string[] (required, UUID v4)
 *    },
 *    fulfillmentNotes?: string (max 500 chars),
 *    shipmentNotes?: string (max 500 chars),
 *    shipmentBatchNote?: string (max 500 chars)
 *  }
 *
 * Business rules:
 *  - `allocations.ids` must be a non-empty array of valid UUIDs.
 *  - Notes are optional but capped at 500 characters for safety.
 *
 * Usage:
 *  - Applied in route middleware via `validate(fulfillOutboundShipmentBodySchema, 'body')`.
 *  - Complements the `orderIdParamSchema` for URL param validation.
 *
 * @constant
 * @type {import('joi').ObjectSchema}
 */
const fulfillOutboundShipmentBodySchema = Joi.object({
  allocations: Joi.object({
    ids: validateUUIDArray('Allocation IDs', { required: true }),
  }),
  fulfillmentNotes: validateOptionalString('Fulfillment Notes', 500),
  shipmentNotes: validateOptionalString('Shipment Notes', 500),
  shipmentBatchNote: validateOptionalString('Shipment Batch Notes', 500),
});

/**
 * Joi schema: fulfillAdjustmentBodySchema
 *
 * Validates the request body for fulfillment adjustment.
 *
 * Business rule:
 *  - Ensures client provides the target statuses for order, shipment, and fulfillment.
 *  - Each status must be a valid string code recognized by the system.
 *
 * Fields:
 *  - orderStatus {string} (required)
 *      - Target order status code
 *      - Example: "ORDER_FULFILLED"
 *  - shipmentStatus {string} (required)
 *      - Target shipment status code
 *      - Example: "SHIPMENT_READY"
 *  - fulfillmentStatus {string} (required)
 *      - Target fulfillment status code
 *      - Example: "FULFILLMENT_PACKED"
 *
 * Usage:
 *  - Applied as middleware to `/orders/:orderId/fulfillment/fulfill` route.
 *  - Ensures only valid, non-empty status codes are passed to the service layer.
 *
 * @type {Joi.ObjectSchema}
 */
const fulfillAdjustmentBodySchema = Joi.object({
  orderStatus: validateString('Order Status', 2, 100).description(
    'Target order status code, e.g. ORDER_FULFILLED'
  ),
  shipmentStatus: validateString('Shipment Status', 2, 100).description(
    'Target shipment status code, e.g. SHIPMENT_READY'
  ),
  fulfillmentStatus: validateString('Fulfillment Status', 2, 100).description(
    'Target fulfillment status code, e.g. FULFILLMENT_PACKED'
  ),
});

module.exports = {
  fulfillOutboundShipmentBodySchema,
  fulfillAdjustmentBodySchema,
};
