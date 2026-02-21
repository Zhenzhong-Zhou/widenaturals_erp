const Joi = require('joi');
const {
  validateUUID,
  validateOptionalString,
  paginationSchema,
  createSortSchema,
  validateUUIDOrUUIDArrayOptional,
  validateOptionalUUID,
  createdDateRangeSchema,
  updatedDateRangeSchema,
  validateUUIDArray,
  validatePositiveDecimal,
} = require('./general-validators');
const { updateStatusIdSchema } = require('./status-validators');
const { CODE_RULES } = require('../utils/validation/code-rules');
const { BARCODE_REGEX } = require('../utils/constants/domain/sku-constants');

/**
 * Joi schema: getPaginatedSkuProductCardsSchema
 *
 * Validates the full normalized query object for:
 *   GET /api/v1/skus/cards
 *
 * Combined from:
 *   - paginationSchema
 *   - createSortSchema('skuProductCards')
 *   - skuProductCardFiltersSchema (wrapped under `filters`)
 *
 * This ensures:
 *   - Pagination is numeric & valid
 *   - Sorting keys match server-side sort map
 *   - Filter fields are validated & sanitized
 *   - `filters` always exists (defaults to {})
 *
 * @type {Joi.ObjectSchema}
 */
const getPaginatedSkuProductCardsSchema = paginationSchema
  .concat(createSortSchema('defaultNaturalSort'))
  .keys({
    //
    // PRODUCT filters
    //
    productName: validateOptionalString('Product Name'),
    brand: validateOptionalString('Brand'),
    category: validateOptionalString('Category'),

    //
    // SKU filters
    //
    sku: validateOptionalString('SKU Code'),
    skuIds: Joi.alternatives().try(
      validateUUIDArray('SKU IDs'),
      validateOptionalUUID('SKU ID')
    ),
    sizeLabel: validateOptionalString('Size Label'),
    countryCode: validateOptionalString('Country Code'),
    marketRegion: validateOptionalString('Market Region'),
    skuStatusId: validateOptionalUUID('SKU Status ID'),
    productStatusId: validateOptionalUUID('Product Status ID'),

    //
    // COMPLIANCE
    //
    complianceId: validateOptionalString('Compliance ID'),

    //
    // KEYWORD
    //
    keyword: Joi.string().trim().allow('', null).optional(),
  })
  .unknown(false);

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
    .pattern(CODE_RULES.BRAND)
    .required(),

  category_code: Joi.string()
    .trim()
    .uppercase()
    .pattern(CODE_RULES.CATEGORY)
    .required(),

  variant_code: Joi.string()
    .trim()
    .uppercase()
    .pattern(CODE_RULES.VARIANT)
    .required(),

  region_code: Joi.string()
    .trim()
    .uppercase()
    .pattern(CODE_RULES.REGION)
    .required(),

  barcode: Joi.string().trim().pattern(BARCODE_REGEX).allow('', null).messages({
    'string.pattern.base': 'Barcode format is invalid.',
  }),

  language: Joi.string().trim().max(10).allow(null),

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
  skus: Joi.array().items(createSkuSchema).min(1).max(200).required(),
});

/**
 * Validation Schema: Update SKU Metadata
 *
 * Validates partial updates to non-operational SKU metadata fields.
 *
 * Rules:
 * - All fields are optional individually.
 * - At least one field must be provided (.min(1)).
 * - Language must match alphabetic characters and hyphens only.
 *
 * Allowed Fields:
 * - description (string, max 2000)
 * - size_label (string, max 100)
 * - language (string, max 10, pattern: letters + hyphen)
 * - market_region (string, max 100)
 *
 * This schema is used by:
 *   PATCH /api/skus/:skuId/metadata
 */
const updateSkuMetadataSchema = Joi.object({
    description: validateOptionalString('Description',2000),

    size_label: validateOptionalString('Size label', 100),

    language: validateOptionalString('Language', 10)
      .pattern(/^[a-zA-Z-]+$/),

    market_region: validateOptionalString('Market Region', 100),
  })
  .min(1)
  .messages({
    'object.min': 'At least one metadata field must be provided.',
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

/**
 * Validation Schema: Update SKU Dimensions
 *
 * Validates partial updates to physical dimension attributes of a SKU.
 *
 * Rules:
 * - All fields are optional individually.
 * - At least one dimension field must be provided (.min(1)).
 * - All dimension values must be strictly positive decimals
 *   with up to 2 decimal precision.
 *
 * Allowed Fields:
 * - length_cm  (positive decimal)
 * - width_cm   (positive decimal)
 * - height_cm  (positive decimal)
 * - weight_g   (positive decimal)
 *
 * Used by:
 *   PATCH /api/skus/:skuId/dimensions
 */
const updateSkuDimensionsSchema = Joi.object({
    length_cm: validatePositiveDecimal(),
    width_cm: validatePositiveDecimal(),
    height_cm: validatePositiveDecimal(),
    weight_g: validatePositiveDecimal(),
  })
  .min(1)
  .messages({
    'object.min': 'At least one dimension field must be provided.',
  });

/**
 * Validation Schema: Update SKU Identity
 *
 * Validates partial updates to identity-related attributes of a SKU.
 *
 * Rules:
 * - All fields are optional individually.
 * - At least one identity field must be provided (.min(1)).
 * - SKU must contain only uppercase letters, numbers, and hyphens.
 * - Barcode must contain numeric characters only.
 *
 * Allowed Fields:
 * - sku     (string, max 100, pattern: /^[A-Z0-9-]+$/)
 * - barcode (string, max 100, numeric only)
 *
 * Used by:
 *   PATCH /api/skus/:skuId/identity
 */
const updateSkuIdentitySchema = Joi.object({
    sku: Joi.string()
      .max(100)
      .pattern(/^[A-Z0-9-]+$/)
      .messages({
        'string.pattern.base':
          'SKU must contain only uppercase letters, numbers, and hyphens.',
      }),
    
    barcode: Joi.string()
      .max(100)
      .pattern(/^[0-9]+$/)
      .messages({
        'string.pattern.base':
          'Barcode must contain only numeric characters.',
      }),
  })
  .min(1)
  .messages({
    'object.min': 'At least one identity field must be provided.',
  });

module.exports = {
  getPaginatedSkuProductCardsSchema,
  skuIdParamSchema,
  skuQuerySchema,
  createSkuBulkSchema,
  updateSkuMetadataSchema,
  updateSkuStatusSchema,
  updateSkuDimensionsSchema,
  updateSkuIdentitySchema,
};
