const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  validateUUIDOrUUIDArrayOptional,
  validateOptionalString,
  optionalIsoDate,
  validateUUID, validateOptionalText,
} = require('./general-validators');

/**
 * Batch Registry query schema
 *
 * Validates query parameter shape and types for paginated
 * batch registry list endpoints.
 *
 * Includes:
 * - Pagination
 * - Sorting (default: registered_at)
 * - Registry-level date ranges
 * - Batch-level filters (product / packaging)
 * - Keyword fuzzy search (interpretation deferred to service layer)
 *
 * NOTE:
 * - Visibility rules (product vs packaging batches, metadata access)
 *   are enforced in business/service layers
 * - Keyword field eligibility is determined by ACL (NOT client input)
 * - This schema validates input shape and types ONLY
 * - No filtering, visibility, or search logic is applied here
 */
const batchRegistryQuerySchema = paginationSchema
  .concat(createSortSchema('registered_at'))
  .keys({
    // --------------------------------------------------
    // Core batch registry filters
    // --------------------------------------------------
    batchType: Joi.string()
      .valid('product', 'packaging_material')
      .optional()
      .messages({
        'string.base': 'Batch Type must be a string',
        'any.only': 'Batch Type must be one of: product, packaging_material',
      }),

    statusIds: validateUUIDOrUUIDArrayOptional('Batch Status IDs'),

    // --------------------------------------------------
    // Product batch filters
    // --------------------------------------------------
    skuIds: validateUUIDOrUUIDArrayOptional('SKU IDs'),
    productIds: validateUUIDOrUUIDArrayOptional('Product IDs'),
    manufacturerIds: validateUUIDOrUUIDArrayOptional('Manufacturer IDs'),

    // --------------------------------------------------
    // Packaging batch filters
    // --------------------------------------------------
    packagingMaterialIds: validateUUIDOrUUIDArrayOptional(
      'Packaging Material IDs'
    ),
    supplierIds: validateUUIDOrUUIDArrayOptional('Supplier IDs'),

    // --------------------------------------------------
    // Lot number (explicit, non-keyword)
    // --------------------------------------------------
    lotNumber: validateOptionalString('Lot Number'),

    // --------------------------------------------------
    // Expiry date filters (polymorphic)
    // --------------------------------------------------
    expiryAfter: optionalIsoDate('Expiry Date After'),
    expiryBefore: optionalIsoDate('Expiry Date Before'),

    // --------------------------------------------------
    // Registry-level audit date filters
    // --------------------------------------------------
    registeredAfter: optionalIsoDate('Registered After'),
    registeredBefore: optionalIsoDate('Registered Before'),

    // --------------------------------------------------
    // Keyword search (ACL-governed upstream)
    // --------------------------------------------------
    keyword: validateOptionalString(
      'Keyword for fuzzy match (lot, product, SKU, material, supplier)'
    ),
  });

/**
 * Joi schema: Validate Batch Registry ID route parameter.
 *
 * Used for routes like:
 *   PATCH /api/v1/batch-registries/:batchRegistryId/note
 *   GET   /api/v1/batch-registries/:batchRegistryId
 *   DELETE /api/v1/batch-registries/:batchRegistryId
 *
 * Ensures the provided batch registry ID is a valid UUID.
 *
 * @constant
 * @type {Joi.ObjectSchema}
 *
 * @example
 * // Example usage in middleware
 * const { error } = batchRegistryIdParamSchema.validate(req.params);
 * if (error) throw AppError.validationError(error.message);
 */
const batchRegistryIdParamSchema = Joi.object({
  batchRegistryId: validateUUID('Batch Registry ID')
    .description('UUID of the batch registry record'),
});

/**
 * Joi schema: Validate request body for updating a batch registry note.
 *
 * Used for routes like:
 *   PATCH /api/v1/batch-registries/:batchRegistryId/note
 *
 * Ensures the note field is a valid trimmed string within allowed
 * length constraints. The note may be cleared by sending an empty
 * string or null.
 *
 * @constant
 * @type {Joi.ObjectSchema}
 *
 * @example
 * // Example usage in middleware
 * const { error } = updateBatchRegistryNoteSchema.validate(req.body);
 * if (error) throw AppError.validationError(error.message);
 */
const updateBatchRegistryNoteSchema = Joi.object({
  note: validateOptionalText('Batch registry note'),
});

module.exports = {
  batchRegistryQuerySchema,
  batchRegistryIdParamSchema,
  updateBatchRegistryNoteSchema
};
