const Joi = require('joi');

/**
 * Base Joi schema for validating common lookup query parameters.
 *
 * This base schema defines reusable validation rules for keyword search,
 * pagination limit, and offset. It can be extended or wrapped by specific
 * lookup schemas (e.g., customer, batch, material).
 *
 * Fields:
 * - keyword: Optional string keyword for partial match search (max 100 characters).
 * - limit: Optional integer for number of records to return (default 50, max 100).
 * - offset: Optional integer for pagination offset (default 0, min 0).
 *
 * @type {Object}
 */
const baseLookupQuerySchema = {
  keyword: Joi.string().allow('').max(100).label('Keyword'),
  limit: Joi.number().integer().min(1).max(100).default(50).label('Limit'),
  offset: Joi.number().integer().min(0).default(0).label('Offset'),
};

/**
 * Joi validation schema for customer lookup query parameters.
 *
 * This schema validates and normalizes the query parameters used
 * for customer lookup endpoints (e.g., dropdowns or autocomplete).
 *
 * @type {import('joi').ObjectSchema}
 *
 * @example
 * const { error, value } = customerLookupQuerySchema.validate(req.query);
 * if (error) throw AppError.validationError(error.details.map(d => d.message).join(', '));
 * // value = { keyword: 'john', limit: 50, offset: 0 }
 */
const customerLookupQuerySchema = Joi.object(baseLookupQuerySchema);

module.exports = {
  customerLookupQuerySchema,
};
