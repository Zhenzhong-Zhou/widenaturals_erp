/**
 * @file pricing-validators.js
 * @description Joi validation schemas for pricing endpoints.
 *
 * Exports:
 *  - pricingGroupParamsSchema   — route param validation for endpoints requiring a pricing group ID
 *  - pricingJoinQuerySchema     — query validation for the paginated pricing join list endpoint
 *  - pricingExportQuerySchema   — query validation for the pricing export endpoint
 */

'use strict';

const Joi = require('joi');
const {
  validateOptionalUUID,
  validateUUID,
  paginationSchema,
  createSortSchema,
} = require('./general-validators');

// ─── Params ───────────────────────────────────────────────────────────────────

/**
 * Validates route params for pricing group endpoints that require a pricing group ID.
 *
 * @type {Joi.ObjectSchema}
 * @property {string} pricingGroupId - UUID of the pricing group record.
 */
const pricingGroupParamsSchema = Joi.object({
  pricingGroupId: validateUUID('Pricing Group ID')
    .description('UUID of the pricing group record'),
});

// ─── Pricing Join List ────────────────────────────────────────────────────────

/**
 * Validates query parameters for the paginated pricing join list endpoint.
 * Scope is determined by filters — pass pricingGroupId, pricingTypeId, or
 * skuId to narrow results, or omit for a cross-group price book view.
 *
 * @type {Joi.ObjectSchema}
 * @property {string}  [pricingGroupId]  - Scope to a specific pricing group (UUID).
 * @property {string}  [pricingTypeId]   - Scope to a specific pricing type (UUID).
 * @property {string}  [skuId]           - Scope to a specific SKU (UUID).
 * @property {string}  [productId]       - Filter by product UUID.
 * @property {string}  [search]          - Fuzzy match on sku, barcode, product name (max 100 chars).
 * @property {string}  [brand]           - Filter by brand name (max 100 chars).
 * @property {string}  [category]        - Filter by category name (max 100 chars).
 * @property {string}  [countryCode]     - Filter by country code (max 10 chars).
 */
const pricingJoinQuerySchema = paginationSchema
  .concat(createSortSchema('productName'))
  .concat(Joi.object({
    pricingGroupId: validateOptionalUUID('Pricing Group ID'),
    pricingTypeId:  validateOptionalUUID('Pricing Type ID'),
    skuId:          validateOptionalUUID('SKU ID'),
    productId:      validateOptionalUUID('Product ID'),
    search:         Joi.string().max(100).optional(),
    brand:          Joi.string().max(100).optional(),
    category:       Joi.string().max(100).optional(),
    countryCode:    Joi.string().max(10).optional(),
  }));

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Validates query parameters for the pricing export endpoint.
 *
 * @type {Joi.ObjectSchema}
 * @property {string} [pricingTypeId]  - Filter by pricing type UUID.
 * @property {string} [countryCode]    - Filter by country code (max 10 chars).
 * @property {string} [statusId]       - Filter by status UUID.
 * @property {string} [brand]          - Filter by brand name (max 100 chars).
 * @property {string} [productId]      - Filter by product UUID.
 * @property {string} [exportFormat]   - Export format: 'csv' or 'xlsx' (default: 'xlsx').
 */
const pricingExportQuerySchema = Joi.object({
  pricingTypeId: validateOptionalUUID('Pricing Type ID'),
  countryCode:   Joi.string().max(10).optional(),
  statusId:      validateOptionalUUID('Status ID'),
  brand:         Joi.string().max(100).optional(),
  productId:     validateOptionalUUID('Product ID'),
  exportFormat:  Joi.string().valid('csv', 'xlsx').default('xlsx'),
});

module.exports = {
  pricingGroupParamsSchema,
  pricingJoinQuerySchema,
  pricingExportQuerySchema,
};
