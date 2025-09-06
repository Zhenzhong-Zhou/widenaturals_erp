const Joi = require('joi');
const { baseOrderSchema } = require('./order-validators');
const { salesOrderItemSchema } = require('./order-item-validators');
const { validateOptionalUUID, validateUUID } = require('./general-validators');

/**
 * Joi schema for validating a sales order payload.
 *
 * Extends the base order schema with sales-specific fields:
 * - `customer_id` (UUID, required): Reference to the customer.
 * - `payment_status_id` (UUID, optional): Reference to payment status.
 * - `payment_method_id` (UUID, optional): Reference to payment method.
 * - `currency_code` (string, 3 chars, optional, default 'CAD'): Currency code (ISO format).
 * - `exchange_rate` (number, optional, min 0): Exchange rate against base currency.
 * - `base_currency_amount` (number, optional, min 0): Value in base currency.
 * - `discount_id` (UUID, optional): Reference to applied discount.
 * - `tax_rate_id` (UUID, required): Reference to tax rate applied.
 * - `shipping_fee` (number, optional, min 0): Shipping fee amount.
 * - `delivery_method_id` (UUID, required): Reference to delivery method.
 * - `order_items` (array, required): List of order items, must have at least one.
 *
 * @type {Joi.ObjectSchema}
 */
const salesOrderSchema = baseOrderSchema.keys({
  customer_id: Joi.string().uuid().required(),
  payment_method_id: validateUUID('Payment Method ID'),
  currency_code: Joi.string().length(3).default('CAD'),
  exchange_rate: Joi.number().precision(4).min(0).default(1),
  base_currency_amount: Joi.number().precision(2).min(0).allow(null),
  discount_id: validateOptionalUUID('Discount ID'),
  tax_rate_id: validateUUID('Tax Rate ID'),
  shipping_fee: Joi.number().precision(2).min(0).optional().allow(null),
  delivery_method_id: validateUUID('Delivery Method ID'),
  order_items: Joi.array().items(salesOrderItemSchema).min(1).required(),
});

module.exports = salesOrderSchema;
