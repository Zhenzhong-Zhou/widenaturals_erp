const Joi = require('joi');
const {
  validateUUID,
  validateOptionalString
} = require('./general-validators');

/**
 * Joi schema: Validate SKU ID route parameter.
 *
 * Used for routes like:
 *   GET /api/v1/skus/:skuId/bom
 *
 * Ensures the provided SKU ID is a valid UUID (v4).
 *
 * @constant
 * @type {Joi.ObjectSchema}
 *
 * @example
 * // Example usage in middleware
 * const { error } = skuIdParamSchema.validate(req.params);
 * if (error) throw AppError.validationError(error.message);
 */
const skuIdParamSchema = Joi.object({
  skuId: validateUUID('SKU ID').description('UUID of the SKU record'),
});

/**
 * @constant
 * @description
 * Joi schema for validating a **single SKU definition**.
 *
 * Ensures:
 *  - Required SKU code components (brand, category, variant, region) follow
 *    ERP code conventions.
 *  - `product_id` is a valid UUID.
 *  - Optional metadata such as barcode, language, and dimensions are properly
 *    typed and normalized.
 *
 * Used when validating individual SKU objects inside bulk creation requests.
 */
const createSkuSchema = Joi.object({
  product_id: validateUUID('Product ID'),
  
  brand_code: Joi.string()
    .trim()
    .uppercase()
    .min(2)
    .max(5)
    .required(),
  
  category_code: Joi.string()
    .trim()
    .uppercase()
    .min(2)
    .max(5)
    .required(),
  
  variant_code: Joi.string()
    .trim()
    .max(10) // Allow extended variant codes (e.g., 120, MO400, TCM300)
    .required(),
  
  region_code: Joi.string()
    .trim()
    .uppercase()
    .min(2)
    .max(5)
    .required(),
  
  barcode: Joi.string().trim().allow(null, ''),
  
  language: Joi.string().trim().max(10).allow(null),
  
  country_code: Joi.string().trim().length(2).uppercase().allow(null),
  
  market_region: Joi.string().trim().max(100).allow(null),
  
  size_label: Joi.string().trim().max(100).allow(null),
  
  description: validateOptionalString('Description'),
  
  length_cm: Joi.number().positive().allow(null),
  width_cm: Joi.number().positive().allow(null),
  height_cm: Joi.number().positive().allow(null),
  weight_g: Joi.number().positive().allow(null),
});

/**
 * @description
 * Bulk SKU creation schema.
 *
 * Validates request bodies structured as:
 *
 * {
 *   "skus": [ { ...createSkuSchema }, ... ]
 * }
 *
 * Enforces:
 *  - Minimum 1 SKU per request.
 *  - Maximum 200 SKUs to prevent overly large transactional workloads.
 *  - Full validation of each SKU object using `createSkuSchema`.
 */
const createSkuBulkSchema = Joi.object({
  skus: Joi.array()
    .items(createSkuSchema)
    .min(1)
    .max(200)
    .required(),
});

module.exports = {
  skuIdParamSchema,
  createSkuBulkSchema,
};
