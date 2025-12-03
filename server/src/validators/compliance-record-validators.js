const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  createdDateRangeSchema,
  updatedDateRangeSchema,
  validateOptionalUUID,
  validateOptionalString,
  validateUUIDArray,
  issuedDateRangeSchema,
  expiryDateRangeSchema,
} = require('./general-validators');

/**
 * Joi schema for validating compliance record filters.
 *
 * This schema validates all allowed filter fields for:
 *   - Compliance-level fields (cr.*)
 *   - SKU-level fields (s.*)
 *   - Product-level fields (p.*)
 *   - Keyword fuzzy search
 *
 * Notes:
 *   - This schema only validates the `filters` object itself.
 *   - Date range fields are validated separately and composed via .concat()
 *   - All fields are optional and may be combined freely.
 *
 * @type {Joi.ObjectSchema}
 */
const complianceFiltersSchema = Joi.object({
  //
  // --------------------------------------------------
  // Compliance-level filters (cr.*)
  // --------------------------------------------------
  //
  type: validateOptionalString('Type'),
  statusIds: validateUUIDArray('Status IDs'),
  complianceId: validateOptionalString('Compliance Number'),
  createdBy: validateOptionalUUID('Created By User ID'),
  updatedBy: validateOptionalUUID('Updated By User ID'),

  //
  // --------------------------------------------------
  // SKU-level filters (s.*)
  // --------------------------------------------------
  //
  skuIds: validateUUIDArray('SKU IDs'),
  sku: validateOptionalString('SKU'),
  sizeLabel: validateOptionalString('Size Label'),
  marketRegion: validateOptionalString('Market Region'),

  //
  // --------------------------------------------------
  // Product-level filters (p.*)
  // --------------------------------------------------
  //
  productIds: validateUUIDArray('Product IDs'),
  productName: validateOptionalString('Product Name'),
  brand: validateOptionalString('Brand'),
  category: validateOptionalString('Category'),

  //
  // --------------------------------------------------
  // Keyword fuzzy search
  // --------------------------------------------------
  //
  keyword: validateOptionalString('Keyword for fuzzy match'),
}).unknown(false); // Strict: disallow unknown keys

/**
 * Combined Joi schema for:
 *   - Pagination (page & limit)
 *   - Sorting (sortBy & sortOrder)
 *   - Created/Updated date ranges
 *   - Issued/Expiry date ranges
 *   - Compliance filter object
 *
 * This schema should validate the full set of query params for:
 *   GET /compliance-records
 *
 * The `filters` object is nested and validated separately using
 * `complianceFiltersSchema`.
 *
 * @type {Joi.ObjectSchema}
 */
const getPaginatedComplianceRecordsSchema = paginationSchema
  // Sorting (default sort: cr.created_at)
  .concat(createSortSchema('cr.created_at'))

  // Date range filters (outer-level fields)
  .concat(createdDateRangeSchema)
  .concat(updatedDateRangeSchema)
  .concat(issuedDateRangeSchema)
  .concat(expiryDateRangeSchema)

  // Nested filter object
  .keys({
    filters: complianceFiltersSchema.default({}),
  });

module.exports = {
  getPaginatedComplianceRecordsSchema,
};
