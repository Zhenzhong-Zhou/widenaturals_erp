const Joi = require('joi');
const { validateUUID, validateString } = require('./general-validators');
const { ORDER_CATEGORIES } = require('../utils/constants/domain/order-type-constants');
const { ORDER_STATUS_CODES } = require('../utils/constants/domain/order-status-constants');

/**
 * Joi schema for validating base order payload.
 *
 * This schema ensures the core order fields meet required format and data types.
 *
 * Fields:
 * - `order_type_id` (string, required, UUID): The type of the order.
 * - `order_date` (string, required, ISO date): The date the order was placed.
 * - `note` (string, optional, max 1000 chars): Additional notes for the order.
 * - `shipping_address_id` (string, optional, UUID or null): Shipping address reference.
 * - `billing_address_id` (string, optional, UUID or null): Billing address reference.
 * - `metadata` (object, optional): Additional custom metadata as a JSON object.
 *
 * @type {Joi.ObjectSchema}
 */
const baseOrderSchema = Joi.object({
  order_type_id: Joi.string().uuid().required(),
  order_date: Joi.date().iso().required(),
  note: Joi.string().max(1000).allow(null, ''),
  shipping_address_id: Joi.string().uuid().allow(null),
  billing_address_id: Joi.string().uuid().allow(null),
  metadata: Joi.object().optional(),
});

/**
 * Joi schema for validating route parameters that identify a specific order.
 *
 * Fields:
 *   - category (string): The order category, such as 'SALES', 'TRANSFER', etc.
 *       - Must be one of the allowed ORDER_CATEGORIES.
 *       - Length must be between 5 and 20 characters.
 *   - orderId (UUID): The unique identifier of the order.
 *       - Must be a valid UUID (v4 format expected).
 *
 * Common Usage:
 *   - Route parameters validation for endpoints like:
 *       PATCH /:category/:orderId/status
 *       GET   /:category/orders/:orderId
 *
 * Example:
 *   {
 *     category: 'SALES',
 *     orderId: '550e8400-e29b-41d4-a716-446655440000'
 *   }
 */
const orderIdentifierSchema = Joi.object({
  category: validateString('Category', 5, 20).valid(...ORDER_CATEGORIES),
  orderId: validateUUID('Order ID'),
});

/**
 * Joi schema for validating route parameters when fetching order details.
 *
 * Expected shape:
 *   {
 *     category: string (required, trimmed, one of ORDER_CATEGORIES)
 *     orderId: string (required, UUID v4)
 *   }
 *
 * Validation rules:
 *   - `category`:
 *       • Required string between 5 and 20 characters (inclusive).
 *       • Must match one of the allowed `ORDER_CATEGORIES`.
 *       • Leading/trailing whitespace is automatically trimmed.
 *       • Custom label for error messages: "Category".
 *   - `orderId`:
 *       • Required string.
 *       • Must be a valid UUID v4.
 *       • Leading/trailing whitespace is automatically trimmed.
 *       • Custom label for error messages: "Order ID".
 *
 * Example valid values:
 *   {
 *     category: "sales",
 *     orderId: "550e8400-e29b-41d4-a716-446655440000"
 *   }
 *   {
 *     category: "purchase",
 *     orderId: " 550e8400-e29b-41d4-a716-446655440000 " // will be trimmed
 *   }
 *
 * @type {import('joi').ObjectSchema}
 */
// todo: reuse orderIdentifierSchema
const getOrderDetailsParamsSchema = Joi.object({
  category: validateString('Category', 5, 20).valid(...ORDER_CATEGORIES),
  orderId: validateUUID('Order ID'),
});

/**
 * Joi schema for validating the body of an update-order-status request.
 *
 * Validates:
 *   - statusCode (string): Required.
 *       - Must be one of the predefined ORDER_STATUS_CODES.
 *       - Length must be between 6 and 20 characters.
 *
 * This schema is intended for validating:
 *   - req.body.statusCode
 *
 * To fully validate an update status request, use this in conjunction with:
 *   - `orderIdentifierSchema` to validate req.params (category and orderId)
 *
 * @example
 * const { error, value } = updateOrderStatusSchema.validate({
 *   statusCode: 'ORDER_CONFIRMED',
 * });
 */
const updateOrderStatusSchema = Joi.object({
  statusCode: validateString('Status Code', 6, 20).valid(...ORDER_STATUS_CODES),
});

module.exports = {
  baseOrderSchema,
  orderIdentifierSchema,
  getOrderDetailsParamsSchema,
  updateOrderStatusSchema,
};
