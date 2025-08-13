const Joi = require('joi');
const { validateUUID, validateString } = require('./general-validators');
const { ORDER_CATEGORIES } = require('../utils/constants/domain/order-type-constants');

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
const getOrderDetailsParamsSchema = Joi.object({
  category: validateString('Category', 5, 20).valid(...ORDER_CATEGORIES),
  orderId: validateUUID('Order ID'),
});

module.exports = {
  baseOrderSchema,
  getOrderDetailsParamsSchema,
};
