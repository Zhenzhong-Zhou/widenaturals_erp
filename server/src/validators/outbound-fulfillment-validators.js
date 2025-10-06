const Joi = require('joi');
const {
  validateOptionalString,
  validateUUIDArray,
  validateString,
  createSortSchema,
  validateUUIDOrUUIDArrayOptional,
  validateOptionalUUID,
  createdDateRangeSchema,
  shippedDateRangeSchema,
  paginationSchema
} = require('./general-validators');

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
 * Validates the request body for outbound fulfillment confirmation.
 *
 * Business rules:
 *  - Ensures client provides all target status codes required for confirmation workflow:
 *      • Order status
 *      • Allocation status
 *      • Shipment status
 *      • Fulfillment status
 *  - Each field must be a valid, non-empty string corresponding to a known status code.
 *
 * Fields:
 *  - orderStatus {string} (required)
 *      → Target order status code
 *      → Example: "ORDER_FULFILLED"
 *
 *  - allocationStatus {string} (required)
 *      → Target inventory allocation status code
 *      → Example: "ALLOC_FULFILLED"
 *
 *  - shipmentStatus {string} (required)
 *      → Target shipment status code
 *      → Example: "SHIPMENT_READY"
 *
 *  - fulfillmentStatus {string} (required)
 *      → Target fulfillment status code
 *      → Example: "FULFILLMENT_PACKED"
 *
 * Usage:
 *  - Applied as middleware to `/orders/:orderId/fulfillment/confirm` route.
 *  - Ensures the client explicitly defines the intended transition states
 *    before executing inventory, allocation, and fulfillment updates.
 *
 * Example valid payload:
 * {
 *   "orderStatus": "ORDER_FULFILLED",
 *   "allocationStatus": "ALLOC_FULFILLED",
 *   "shipmentStatus": "SHIPMENT_READY",
 *   "fulfillmentStatus": "FULFILLMENT_PACKED"
 * }
 *
 * @type {Joi.ObjectSchema}
 */
const fulfillAdjustmentBodySchema = Joi.object({
  orderStatus: validateString('Order Status', 2, 100).description(
    'Target order status code, e.g. ORDER_FULFILLED'
  ),
  allocationStatus: validateString('Allocation Status', 2, 100).description(
    'Target allocation status code, e.g. ALLOC_FULFILLED'
  ),
  shipmentStatus: validateString('Shipment Status', 2, 100).description(
    'Target shipment status code, e.g. SHIPMENT_READY'
  ),
  fulfillmentStatus: validateString('Fulfillment Status', 2, 100).description(
    'Target fulfillment status code, e.g. FULFILLMENT_PACKED'
  ),
});

/**
 * Joi schema for validating outbound fulfillment (shipment) query parameters.
 *
 * Combines pagination, sorting, and domain-specific filters into a single schema
 * for use in controllers and middleware.
 *
 * ### Includes:
 * - **Pagination**
 *   - `page` (default: 1)
 *   - `limit` (default: 10)
 *
 * - **Sorting**
 *   - `sortBy` (default: `created_at`, validated against outboundShipmentSortMap)
 *   - `sortOrder` (`ASC` or `DESC`)
 *
 * - **Date Ranges**
 *   - `createdAfter` / `createdBefore`
 *   - `shippedAfter` / `shippedBefore`
 *
 * - **Shipment-level Filters**
 *   - `statusIds` → array of Shipment Status IDs
 *   - `warehouseIds` → array of Warehouse IDs
 *   - `deliveryMethodIds` → array of Delivery Method IDs
 *   - `createdBy` → filter by creator user ID
 *   - `updatedBy` → filter by last updater user ID
 *
 * - **Order-level Filters**
 *   - `orderId` → specific order UUID
 *   - `orderNumber` → fuzzy match on order number
 *
 * - **Keyword Search**
 *   - `keyword` → fuzzy match across order number, warehouse name, delivery method
 *
 * ### Usage:
 * Used in:
 * - `createQueryNormalizationMiddleware` for `/outbound-fulfillments`
 * - Validation of query params in controllers
 *
 * @type {Joi.ObjectSchema}
 */
const outboundFulfillmentQuerySchema = paginationSchema
  // Default sort field
  .concat(createSortSchema('created_at'))
  // Date range filters
  .concat(createdDateRangeSchema)
  .concat(shippedDateRangeSchema)
  .keys({
    // --- Shipment-level filters ---
    statusIds: validateUUIDOrUUIDArrayOptional('Shipment Status IDs'),
    warehouseIds: validateUUIDOrUUIDArrayOptional('Warehouse IDs'),
    deliveryMethodIds: validateUUIDOrUUIDArrayOptional('Delivery Method IDs'),
    
    createdBy: validateOptionalUUID('Shipment Created By User ID'),
    updatedBy: validateOptionalUUID('Shipment Updated By User ID'),
    
    // --- Order-level filters ---
    orderId: validateOptionalUUID('Order ID'),
    orderNumber: validateOptionalString('Order Number'),
    
    // --- Keyword search ---
    keyword: validateOptionalString(
      'Keyword for fuzzy matching (order number, warehouse, delivery method)'
    ),
  });

module.exports = {
  fulfillOutboundShipmentBodySchema,
  fulfillAdjustmentBodySchema,
  outboundFulfillmentQuerySchema,
};
