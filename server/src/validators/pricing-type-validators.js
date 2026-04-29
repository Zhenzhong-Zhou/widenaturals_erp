/**
 * @file pricing-type-validators.js
 * @description Joi validation schemas for pricing type routes. Covers UUID param
 * validation and query filter/sort/pagination for the pricing type list endpoint.
 */

const Joi = require('joi');
const {
  validateOptionalUUID,
  paginationSchema,
  createSortSchema,
  createdDateRangeSchema,
  validateUUID,
} = require('./general-validators');

/**
 * Validates route params for pricing type detail/update/delete endpoints.
 *
 * @type {Joi.ObjectSchema}
 * @property {string} pricingTypeId - UUID of the target pricing type record.
 */
const pricingTypeParamsSchema = Joi.object({
  pricingTypeId: validateUUID('Pricing Type ID').description(
    'UUID of the pricing type record'
  ),
});

/**
 * Validates query parameters for the paginated pricing type list endpoint.
 * Extends the base pagination, sort, and date-range schemas with pricing-type-
 * specific filters.
 *
 * @type {Joi.ObjectSchema}
 * @property {string}  [search]    - Partial name search string (max 100 chars).
 * @property {string}  [statusId]  - Filter by status UUID.
 * @property {string}  [createdBy] - Filter by creator user UUID.
 * @property {string}  [updatedBy] - Filter by last-updater user UUID.
 */
const pricingTypeQuerySchema = paginationSchema
  .concat(createSortSchema('pricingTypeName'))
  .concat(createdDateRangeSchema)
  .concat(
    Joi.object({
      search: Joi.string().max(100).optional(),
      statusId: validateOptionalUUID('Status ID'),
      createdBy: validateOptionalUUID('Created By'),
      updatedBy: validateOptionalUUID('Updated By'),
    })
  );

module.exports = {
  pricingTypeParamsSchema,
  pricingTypeQuerySchema,
};
