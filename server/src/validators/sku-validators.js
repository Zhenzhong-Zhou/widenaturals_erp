const Joi = require('joi');
const {
  validateUUID,
  validateOptionalString,
  paginationSchema,
  createSortSchema,
  validateUUIDOrUUIDArrayOptional,
  validateOptionalUUID,
  createdDateRangeSchema,
  updatedDateRangeSchema
} = require('./general-validators');
const { updateStatusIdSchema } = require('./status-validators');

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
 * Joi schema for validating SKU list query parameters.
 *
 * This schema unifies pagination, sorting, SKU-level filters, product-level filters,
 * dimensional filters, audit filters, and keyword search into a single validation layer.
 *
 * It is used by controllers and middleware to normalize and validate incoming
 * list/table queries for SKUs.
 *
 * ---
 * ## Pagination
 * - `page`  → page number (default: 1)
 * - `limit` → page size  (default: 10)
 *
 * ## Sorting
 * - `sortBy`    → validated against `skuSortMap` (default: `created_at`)
 * - `sortOrder` → `ASC` or `DESC`
 *
 * ---
 * ## SKU-Level Filters (table: skus)
 * - `statusIds[]`   → array of SKU status UUIDs
 * - `productIds[]`  → array of product UUIDs
 * - `sku`           → partial match
 * - `barcode`
 * - `marketRegion`
 * - `sizeLabel`
 *
 * ### Dimensional Filters (metric + imperial)
 * Length:
 *   - `minLengthCm`, `maxLengthCm` → centimeters
 *   - `minLengthIn`, `maxLengthIn` → inches
 *
 * Width:
 *   - `minWidthCm`,  `maxWidthCm`  → centimeters
 *   - `minWidthIn`,  `maxWidthIn`  → inches
 *
 * Height:
 *   - `minHeightCm`, `maxHeightCm` → centimeters
 *   - `minHeightIn`, `maxHeightIn` → inches
 *
 * Weight:
 *   - `minWeightG`,  `maxWeightG`  → grams
 *   - `minWeightLb`, `maxWeightLb` → pounds
 *
 * (Allows UI to mix and match measurement systems cleanly.)
 *
 * ---
 * ## Product-Level Filters (table: products)
 * - `productName` → partial match
 * - `brand`
 * - `category`
 *
 * ---
 * ## Audit Filters
 * - `createdBy`, `updatedBy`
 * - `createdAfter`, `createdBefore`
 * - `updatedAfter`, `updatedBefore`
 *
 * ---
 * ## Keyword Search (fuzzy)
 * - `keyword` → fuzzy search across:
 *     - SKU code
 *     - product name
 *     - brand
 *     - category
 *
 * ---
 * ### Usage
 * Used in:
 * - `createQueryNormalizationMiddleware('skuSortMap', ...)`
 * - GET `/skus` route validation
 *
 * @type {Joi.ObjectSchema}
 */
const skuQuerySchema = paginationSchema
  .concat(createSortSchema('created_at'))
  .concat(createdDateRangeSchema)
  .concat(updatedDateRangeSchema)
  .keys({
    // -----------------------------------
    // SKU-level filters
    // -----------------------------------
    statusIds: validateUUIDOrUUIDArrayOptional('Status IDs'),
    productIds: validateUUIDOrUUIDArrayOptional('Product IDs'),
    
    sku: validateOptionalString('SKU Code'),
    barcode: validateOptionalString('Barcode'),
    marketRegion: validateOptionalString('Market Region'),
    sizeLabel: validateOptionalString('Size Label'),
    
    // ---- Dimensional Filters (Length, Width, Height — cm / inch) ----
    minLengthCm: Joi.number().min(0).optional(),
    maxLengthCm: Joi.number().min(0).optional(),
    minLengthIn: Joi.number().min(0).optional(),
    maxLengthIn: Joi.number().min(0).optional(),
    minWidthCm: Joi.number().min(0).optional(),
    maxWidthCm: Joi.number().min(0).optional(),
    minWidthIn: Joi.number().min(0).optional(),
    maxWidthIn: Joi.number().min(0).optional(),
    minHeightCm: Joi.number().min(0).optional(),
    maxHeightCm: Joi.number().min(0).optional(),
    minHeightIn: Joi.number().min(0).optional(),
    maxHeightIn: Joi.number().min(0).optional(),
    
    // -----------------------------------
    // Audit filters
    // -----------------------------------
    createdBy: validateOptionalUUID('Created By User ID'),
    updatedBy: validateOptionalUUID('Updated By User ID'),
    
    // -----------------------------------
    // Product-level filters
    // -----------------------------------
    productName: validateOptionalString('Product Name'),
    brand: validateOptionalString('Brand Name'),
    category: validateOptionalString('Category'),
    
    // -----------------------------------
    // Keyword search
    // -----------------------------------
    keyword: validateOptionalString(
      'Keyword for fuzzy match (SKU, product name, brand, category)'
    ),
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

/**
 * Alias: updateSkuStatusSchema
 *
 * Validation schema for updating an SKU's status.
 * This re-exports the shared `updateStatusIdSchema`, which enforces the
 * presence of a single required field:
 *
 *   {
 *     "statusId": "<valid UUID>"
 *   }
 *
 * Purpose of aliasing:
 * - Provides a semantic, SKU-specific schema name for route definitions.
 * - Ensures consistent validation logic across modules (products, SKUs, inventory).
 * - Avoids duplication while still keeping module boundaries clear.
 */
const updateSkuStatusSchema = updateStatusIdSchema;

module.exports = {
  skuIdParamSchema,
  skuQuerySchema,
  createSkuBulkSchema,
  updateSkuStatusSchema,
};
