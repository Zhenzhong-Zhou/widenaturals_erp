/**
 * @file pricing-group-validators.js
 * @description Joi validation schemas for pricing group routes. Covers UUID param
 * validation and query filter/sort/pagination for the pricing group list and
 * associated SKU list endpoints.
 */

const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  createdDateRangeSchema,
  updatedDateRangeSchema,
  validateOptionalUUID,
  validateKeyword,
  createBooleanFlag,
  optionalIsoDate,
  validateUUID,
} = require('./general-validators');

/**
 * Validates route params for pricing group detail/update/delete endpoints.
 *
 * @type {Joi.ObjectSchema}
 * @property {string} pricingGroupId - UUID of the target pricing group record.
 */
const pricingGroupParamsSchema = Joi.object({
  pricingGroupId: validateUUID('Pricing Group ID')
    .description('UUID of the pricing group record'),
});

// ─── Group List ───────────────────────────────────────────────────────────────

/**
 * Validates query parameters for the paginated pricing group list endpoint.
 * Extends base pagination, sort, and created-date-range schemas with
 * pricing-group-specific filters.
 *
 * @type {Joi.ObjectSchema}
 * @property {string}  [pricingTypeId]  - Filter by pricing type UUID.
 * @property {string}  [statusId]       - Filter by status UUID.
 * @property {string}  [countryCode]    - Filter by country code (max 10 chars).
 * @property {number}  [priceMin]       - Minimum price filter (2 decimal precision, ≥ 0).
 * @property {number}  [priceMax]       - Maximum price filter (2 decimal precision, ≥ 0).
 * @property {string}  [validFrom]      - ISO date — include groups valid from this date onward.
 * @property {string}  [validTo]        - ISO date — include groups valid up to this date.
 * @property {string}  [validOn]        - ISO date — include groups valid on this exact date.
 * @property {string}  [skuId]          - Filter by SKU UUID.
 * @property {string}  [productId]      - Filter by product UUID.
 * @property {string}  [keyword]        - Keyword search against group name/description.
 * @property {boolean} [currentlyValid] - Filter to groups whose validity window covers today.
 * @property {string}  [createdBy]      - Filter by creator user UUID.
 * @property {string}  [updatedBy]      - Filter by last-updater user UUID.
 */
const pricingGroupQuerySchema = paginationSchema
  .concat(createSortSchema('pricingTypeName'))
  .concat(createdDateRangeSchema)
  .concat(updatedDateRangeSchema)
  .concat(Joi.object({
    pricingTypeId:  validateOptionalUUID('Pricing Type ID'),
    statusId:       validateOptionalUUID('Status ID'),
    countryCode:    Joi.string().max(10).optional(),
    priceMin:       Joi.number().precision(2).min(0).optional(),
    priceMax:       Joi.number().precision(2).min(0).optional(),
    validFrom:      optionalIsoDate('Valid From'),
    validTo:        optionalIsoDate('Valid To'),
    validOn:        optionalIsoDate('Valid On'),
    skuId:          validateOptionalUUID('SKU ID'),
    productId:      validateOptionalUUID('Product ID'),
    keyword:        validateKeyword('Keyword'),
    currentlyValid: createBooleanFlag('currentlyValid'),
    createdBy:      validateOptionalUUID('Created By'),
    updatedBy:      validateOptionalUUID('Updated By'),
  }));

module.exports = {
  pricingGroupParamsSchema,
  pricingGroupQuerySchema,
};
