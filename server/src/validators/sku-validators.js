const Joi = require('joi');
const { validateUUID } = require('./general-validators');

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

module.exports = {
  skuIdParamSchema,
};
