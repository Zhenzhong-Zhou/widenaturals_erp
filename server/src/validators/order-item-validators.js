const Joi = require('joi');

/**
 * Joi schema for validating base order item payload.
 *
 * Fields:
 * - `quantity_ordered` (number, required, positive integer): Quantity ordered.
 * - `price_id` (string, optional, UUID or null): Reference to pricing record.
 * - `price` (number, optional, min 0, nullable): Unit price for the item.
 * - `metadata` (object, optional): Additional custom metadata as a JSON object.
 *
 * @type {Joi.ObjectSchema}
 */
const baseOrderItemSchema = Joi.object({
  quantity_ordered: Joi.number().integer().positive().required(),
  price_id: Joi.string().uuid().allow(null),
  price: Joi.number().precision(2).min(0).optional().allow(null),
  metadata: Joi.object().optional(),
});

/**
 * Joi schema for validating sales order item payload.
 *
 * Extends base order item schema with sales-specific fields:
 * - `sku_id` (string, required, UUID): SKU reference for the product.
 * - `packaging_material_id` (string, optional, UUID or null): Reference to packaging material if applicable.
 *
 * Custom logic:
 * - Exactly one of `sku_id` or `packaging_material_id` must be provided.
 *
 * @type {Joi.ObjectSchema}
 */
const salesOrderItemSchema = baseOrderItemSchema
  .keys({
    sku_id: Joi.string().uuid().required(),
    packaging_material_id: Joi.string().uuid().allow(null),
  })
  .custom((value, helpers) => {
    const count =
      (value.sku_id ? 1 : 0) + (value.packaging_material_id ? 1 : 0);
    if (count !== 1) {
      return helpers.error('any.invalid', {
        message:
          'Exactly one of sku_id or packaging_material_id must be provided',
      });
    }
    return value;
  }, 'Sales item type check');

module.exports = {
  salesOrderItemSchema,
};
