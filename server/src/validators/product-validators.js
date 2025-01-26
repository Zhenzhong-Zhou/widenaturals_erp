const Joi = require('joi');

const productSchema = Joi.object({
  product_name: Joi.string().max(255).required(),
  series: Joi.string().max(100).optional(),
  brand: Joi.string().max(100).optional(),
  category: Joi.string().max(100).optional(),
  SKU: Joi.string().max(100).required(),
  barcode: Joi.string().max(100).optional(),
  market_region: Joi.string().max(100).optional(),
  length_cm: Joi.number().positive().required(),
  width_cm: Joi.number().positive().required(),
  height_cm: Joi.number().positive().required(),
  weight_g: Joi.number().positive().required(),
  description: Joi.string().optional(),
  status_id: Joi.string().uuid().required(),
});

module.exports = productSchema;
