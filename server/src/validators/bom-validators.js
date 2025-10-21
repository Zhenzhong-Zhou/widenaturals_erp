/**
 * @fileoverview
 * Joi validation schema definitions for the BOM (Bill of Materials) module.
 *
 * Provides reusable schemas for validating and normalizing query parameters
 * used across BOM-related API endpoints, such as:
 *  - Paginated BOM listings (`GET /api/v1/boms`)
 *  - Filtered or searchable BOM lookups
 *  - Admin or reporting queries involving BOM metadata
 *
 * Supports:
 *  - Pagination (`page`, `limit`)
 *  - Sorting (`sortBy`, `sortOrder`)
 *  - Filtering by product, SKU, compliance, status, flags, revision range, or date range
 *  - Keyword search for BOM name, code, or description
 */

const Joi = require('joi');
const {
  validateOptionalUUID,
  validateOptionalString,
  validatePositiveInteger,
  validateKeyword,
  paginationSchema,
  createSortSchema,
  createdDateRangeSchema, validateUUID,
} = require('./general-validators');

/**
 * @typedef {Object} BOMQueryParams
 * @property {number} [page=1] - Page number for pagination.
 * @property {number} [limit=10] - Maximum records per page.
 * @property {string} [sortBy='createdAt'] - Field to sort by (e.g., `productName`, `revision`).
 * @property {'ASC'|'DESC'|'asc'|'desc'} [sortOrder='DESC'] - Sorting direction.
 * @property {string|string[]} [productId] - Filter by one or more product UUIDs.
 * @property {string|string[]} [skuId] - Filter by one or more SKU UUIDs.
 * @property {string} [productName] - Partial match on product name.
 * @property {string} [skuCode] - Partial match on SKU code.
 * @property {string} [complianceStatusId] - Compliance status UUID to filter by.
 * @property {boolean} [onlyActiveCompliance] - Return only SKUs with active compliance records.
 * @property {string} [complianceType] - Compliance type (e.g., `NPN`, `FDA`).
 * @property {string} [statusId] - Filter by BOM status UUID.
 * @property {boolean} [isActive] - Filter by active/inactive BOMs.
 * @property {boolean} [isDefault] - Filter by default BOMs.
 * @property {number} [revisionMin] - Minimum revision number.
 * @property {number} [revisionMax] - Maximum revision number.
 * @property {string} [createdBy] - Filter by creator UUID.
 * @property {string} [updatedBy] - Filter by updater UUID.
 * @property {string} [createdAfter] - ISO timestamp for lower bound of creation date.
 * @property {string} [createdBefore] - ISO timestamp for upper bound of creation date.
 * @property {string} [keyword] - Search term for BOM name/code/description.
 */

/**
 * Joi schema for validating BOM list query parameters.
 *
 * Used in `createQueryNormalizationMiddleware()` and `validate()` middleware
 * before calling the BOM controller.
 *
 * @type {Joi.ObjectSchema<BOMQueryParams>}
 *
 * @example
 * // Example: GET /api/v1/boms?page=2&limit=20&isActive=true&keyword=Capsule
 */
const bomQuerySchema = paginationSchema
  .concat(createSortSchema('created_at'))
  .concat(createdDateRangeSchema)
  .keys({
    // --- Sorting ---
    sortBy: validateOptionalString('Sort Field')
      .valid(
        'productName',
        'brand',
        'series',
        'category',
        'skuCode',
        'complianceType',
        'complianceStatus',
        'revision',
        'isActive',
        'isDefault',
        'statusDate',
        'createdAt',
        'updatedAt',
        'defaultNaturalSort'
      )
      .description('Column name to sort by.'),
    sortOrder: Joi.string()
      .trim()
      .valid('ASC', 'DESC', 'asc', 'desc')
      .default('DESC')
      .description('Sorting order (ASC or DESC).'),
    
    // --- Core Filters ---
    productId: Joi.alternatives()
      .try(
        Joi.array().items(validateOptionalUUID('Product ID')).min(1),
        validateOptionalUUID('Product ID')
      )
      .optional()
      .description('Filter by one or more Product IDs.'),
    
    skuId: Joi.alternatives()
      .try(
        Joi.array().items(validateOptionalUUID('SKU ID')).min(1),
        validateOptionalUUID('SKU ID')
      )
      .optional()
      .description('Filter by one or more SKU IDs.'),
    
    productName: validateOptionalString('Product Name', 200)
      .description('Partial match on product name.'),
    
    skuCode: validateOptionalString('SKU Code', 100)
      .description('Partial match on SKU code.'),
    
    // --- Compliance Filters ---
    complianceStatusId: validateOptionalUUID('Compliance Status ID')
      .description('Filter by specific compliance status (UUID reference).'),
    
    onlyActiveCompliance: Joi.boolean()
      .optional()
      .description('Return only BOMs with SKUs that have active compliance records.'),
    
    complianceType: validateOptionalString('Compliance Type', 50)
      .optional()
      .description('Filter by compliance type (e.g., NPN, FDA).'),
    
    // --- BOM Status ---
    statusId: validateOptionalUUID('Status ID').optional(),
    
    // --- Boolean flags ---
    isActive: Joi.boolean()
      .optional()
      .description('Filter by active/inactive BOMs.'),
    isDefault: Joi.boolean()
      .optional()
      .description('Filter by default BOMs only.'),
    
    // --- Revision range ---
    revisionMin: validatePositiveInteger('Minimum Revision')
      .optional()
      .description('Minimum revision number.'),
    revisionMax: validatePositiveInteger('Maximum Revision')
      .optional()
      .description('Maximum revision number.'),
    
    // --- Audit filters ---
    createdBy: validateOptionalUUID('Created By User ID').optional(),
    updatedBy: validateOptionalUUID('Updated By User ID').optional(),
    
    // --- Keyword search ---
    keyword: validateKeyword()
      .description('Search term for matching BOM name, code, or description.'),
  });

/**
 * Joi schema: Validate BOM ID route parameter.
 *
 * Used for routes like:
 *   GET /api/v1/boms/:bomId/details
 *
 * Ensures the provided BOM ID is a valid UUID (v4).
 *
 * @constant
 * @type {Joi.ObjectSchema}
 *
 * @example
 * // Example usage in middleware
 * const { error } = bomIdParamSchema.validate(req.params);
 * if (error) throw AppError.validationError(error.message);
 */
const bomIdParamSchema = Joi.object({
  bomId: validateUUID('BOM ID').description('UUID of the BOM record'),
});

module.exports = {
  bomQuerySchema,
  bomIdParamSchema,
};
