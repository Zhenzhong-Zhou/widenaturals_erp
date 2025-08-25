const Joi = require('joi');
const {
  validateUUID,
  validateString,
  paginationSchema,
  createSortSchema,
  validateOptionalString,
  validateOptionalUUID,
  createdDateRangeSchema,
  statusDateRangeSchema
} = require('./general-validators');
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
 * Joi schema for validating the `orderId` route parameter.
 *
 * Fields:
 * - `orderId` (UUID)
 *    - Required
 *    - Must be a valid UUID (typically version 4)
 *
 * Common usage:
 * - Route validation for endpoints like:
 *     GET /orders/:orderId
 *     PATCH /orders/:orderId/status
 */
const orderIdParamSchema = Joi.object({
  orderId: validateUUID('Order ID'),
});

/**
 * Joi schema for validating the `category` route parameter.
 *
 * Fields:
 * - `category` (string)
 *    - Required
 *    - Must be one of the allowed `ORDER_CATEGORIES` values
 *    - Length must be between 5 and 20 characters
 *
 * Common usage:
 * - Route validation for category-based lookups:
 *     GET /orders/:category
 *     GET /:category/orders/:orderId
 */
const orderCategorySchema = Joi.object({
  category: validateString('Category', 5, 20).valid(...ORDER_CATEGORIES),
});

/**
 * Joi schema for validating route parameters that uniquely identify an order.
 *
 * This schema is composed by combining:
 * - `orderCategorySchema`: Validates the `category` field.
 * - `orderIdParamSchema`: Validates the `orderId` field.
 *
 * Fields:
 * - `category` (string)
 *    - Required
 *    - Must be one of the allowed `ORDER_CATEGORIES`
 *    - Length must be between 5 and 20 characters
 * - `orderId` (UUID)
 *    - Required
 *    - Must be a valid UUID (typically v4)
 *
 * Common usage:
 *   Used in route validation for endpoints such as:
 *     - PATCH /:category/:orderId/status
 *     - GET   /:category/orders/:orderId
 *
 * Example:
 * {
 *   category: 'SALES',
 *   orderId: '550e8400-e29b-41d4-a716-446655440000'
 * }
 */
const orderIdentifierSchema = orderCategorySchema.concat(orderIdParamSchema);

/**
 * Joi schema for identifying an order by category and UUID.
 *
 * Used in:
 *   - getOrderDetailsParamsSchema
 *   - updateOrderStatusSchema (params)
 *   - any route that uses :category and :orderId
 *
 * Validation:
 *   - category: required, 5–20 chars, must be in ORDER_CATEGORIES
 *   - orderId: required, valid UUID v4
 *
 * @type {import('joi').ObjectSchema}
 */
const getOrderDetailsParamsSchema = orderIdentifierSchema;

/**
 * Joi schema for validating query parameters when fetching paginated orders.
 *
 * This schema combines:
 * - `paginationSchema`: Validates pagination controls (`page`, `limit`)
 * - `createSortSchema`: Validates sorting (`sortBy`, `sortOrder`) with default `created_at`
 * - `createdDateRangeSchema` and `statusDateRangeSchema`: ISO date ranges
 * - Custom filters: `keyword`, `orderNumber`, `orderTypeId`, `orderStatusId`
 *
 * Valid query parameters:
 * - `page` (number): Optional. Page number. Must be ≥ 1. Defaults to 1.
 * - `limit` (number): Optional. Page size. Must be between 1 and 100. Defaults to 10.
 * - `sortBy` (string): Optional. Sortable field name. Defaults to `'created_at'`.
 * - `sortOrder` (string): Optional. Must be `'ASC'` or `'DESC'`. Defaults to `'DESC'`.
 * - `keyword` (string): Optional. Keyword used for free-text search.
 * - `orderNumber` (string): Optional. Filter by order number (partial or exact match).
 * - `orderTypeId` (UUID): Optional. Filter by specific order type.
 * - `orderStatusId` (UUID): Optional. Filter by specific order status.
 * - `createdAfter` (ISO date): Optional. Filter for records created on/after this date.
 * - `createdBefore` (ISO date): Optional. Filter for records created on/before this date.
 * - `statusDateAfter` (ISO date): Optional. Filter for status date on/after this date.
 * - `statusDateBefore` (ISO date): Optional. Filter for status date on/before this date.
 *
 * Note:
 * - `category` is excluded from this schema — it should be validated via route param schema (`orderCategorySchema`)
 *
 * Example:
 *   GET /orders/SALES?page=2&limit=20&sortBy=createdAt&orderStatusId=<uuid>&keyword=Focus
 */
const orderQuerySchema = paginationSchema
  .concat(createSortSchema('created_at'))
  .concat(createdDateRangeSchema)
  .concat(statusDateRangeSchema)
  .keys({
    keyword: validateOptionalString('Keyword'),
    orderNumber: validateOptionalString('Order number'),
    orderTypeId: validateOptionalUUID('Order Type ID'),
    orderStatusId: validateOptionalUUID('Order Status ID'),
    createdBy: validateOptionalUUID('Created By'),
    updatedBy: validateOptionalUUID('Updated By'),
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
  orderIdParamSchema,
  orderCategorySchema,
  orderIdentifierSchema,
  orderQuerySchema,
  getOrderDetailsParamsSchema,
  updateOrderStatusSchema,
};
