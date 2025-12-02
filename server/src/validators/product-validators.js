const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  validateOptionalString,
  validateOptionalUUID,
  validateUUID,
  validateString
} = require('./general-validators');
const { updateStatusIdSchema } = require('./status-validators');

/**
 * BRAND_CATEGORY_REGEX
 *
 * Rules enforced:
 *  - Each word must start with an uppercase letter (A–Z)
 *  - Words may contain:
 *      • letters (a–z, A–Z)
 *      • digits (0–9)
 *      • symbols: ', &, +, /, -
 *  - Multiple words allowed, separated by spaces.
 *  - Hyphens within words allowed.
 *  - ALLCAPS words also accepted.
 *
 * Examples allowed:
 *   "Canaherb"
 *   "Herbal Natural"
 *   "WIDE Naturals"
 *   "Health+"
 *   "Children's Supplements"
 *   "Herbal-Natural Extract"
 *
 * Examples rejected:
 *   "canaherb"              → lowercase start
 *   "herbal Natural"        → first word lowercase
 *   "Herbal natural"        → second word lowercase
 *   "Ωmega Extract"         → unicode not allowed
 */
const BRAND_CATEGORY_REGEX =
  /^[A-Z][a-zA-Z0-9'&+/-]*(\s+[A-Z][a-zA-Z0-9'&+/-]*)*$/;

/**
 * Joi schema for validating product list query parameters.
 *
 * Combines pagination, sorting, and domain-specific filters into a single schema
 * for use in controllers and query normalization middleware.
 *
 * ### Includes:
 * - **Pagination**
 *   - `page` (default: 1)
 *   - `limit` (default: 10)
 *
 * - **Sorting**
 *   - `sortBy` (default: `created_at`, validated against productSortMap)
 *   - `sortOrder` (`ASC` or `DESC`)
 *
 * - **Product Filters**
 *   - `statusIds` → array of Product Status IDs
 *   - `brand` → partial brand match
 *   - `category` → partial category match
 *   - `series` → partial series match
 *   - `createdBy` → user UUID who created
 *   - `updatedBy` → user UUID who last updated
 *
 * - **Keyword Search**
 *   - `keyword` → fuzzy match across name, brand, category, and status name
 *
 * ### Usage:
 * Used in:
 * - `createQueryNormalizationMiddleware` for `/products`
 * - Controllers validating product list endpoints
 *
 * @type {Joi.ObjectSchema}
 */
const productQuerySchema = paginationSchema
  // Default sort field (validated later against productSortMap)
  .concat(createSortSchema('created_at'))
  .keys({
    // --- Product-level filters ---
    statusIds: validateOptionalUUID('Product Status IDs'),
    brand: validateOptionalString('Brand name (partial match allowed)'),
    category: validateOptionalString('Category name (partial match allowed)'),
    series: validateOptionalString('Series (partial match allowed)'),
    
    createdBy: validateOptionalUUID('Product Created By User ID'),
    updatedBy: validateOptionalUUID('Product Updated By User ID'),
    
    // --- Keyword search ---
    keyword: validateOptionalString(
      'Keyword for fuzzy matching across name, brand, category, and status'
    ),
  });

/**
 * Joi schema for validating the `productId` route parameter.
 *
 * Fields:
 * - `productId` (UUID)
 *    - Required
 *    - Must be a valid UUID (typically version 4)
 *
 * Common usage:
 * - Route validation for endpoints like:
 *     GET /products/:productId
 *     PATCH /products/:productId/status
 *     DELETE /products/:productId
 */
const productIdParamSchema = Joi.object({
  productId: validateUUID('Product ID'),
});

/**
 * Alias: updateProductStatusSchema
 *
 * This schema validates the request body for updating a product's status.
 * It is an alias of the shared `updateStatusIdSchema`, which enforces:
 *
 *   {
 *     "statusId": "<valid UUID>"
 *   }
 *
 * Reason for aliasing:
 * - Keeps product module semantics clear (`updateProductStatusSchema`)
 * - Allows the shared core schema to be reused by other modules (SKUs, materials, etc.)
 * - Prevents duplicated validation logic while keeping per-module naming expressive
 */
const updateProductStatusSchema = updateStatusIdSchema;

/**
 * Joi Validation Schema: Product Information Update
 *
 * Validates payloads for updating general product metadata (excluding status).
 * Designed for partial updates — requires at least one valid field.
 *
 * ### Fields
 * - `name` (string, optional): Product display name.
 * - `series` (string, optional): Product series or collection.
 * - `brand` (string, optional): Brand name, up to 100 chars.
 * - `category` (string, optional): Category or classification, up to 100 chars.
 * - `description` (string, optional): Optional text description (can be empty).
 *
 * ### Rules
 * - At least one field must be provided.
 * - All string fields are trimmed and length-validated.
 *
 * @example
 * // Valid payload
 * {
 *   "name": "NMN 3000",
 *   "brand": "Canaherb"
 * }
 *
 * // Invalid payload
 * {}
 * → "At least one product field must be provided for update."
 */
const productUpdateSchema = Joi.object({
    name: validateOptionalString('Product Name', 150),
    series: validateOptionalString('Series', 100),
    brand: validateOptionalString('Brand', 100),
    category: validateOptionalString('Category', 100),
    description: Joi.string().trim().allow('').optional(),
  })
  .or('name', 'series', 'brand', 'category', 'description') // Require ≥1 field
  .messages({
    'object.missing': 'At least one product field must be provided for update.',
  });

/**
 * Schema for validating a single product creation object.
 *
 * Brand & category rules (via BRAND_CATEGORY_REGEX):
 *  - Each word must start with an uppercase letter.
 *  - Words may include letters, digits, and symbols: ', &, +, /, -.
 *  - Multiple words separated by spaces are allowed.
 *  - Accepts Title Case ("Herbal Natural") or ALLCAPS ("CANAHERB").
 *
 * Examples accepted:
 *   "Canaherb"
 *   "Herbal Natural"
 *   "WIDE Naturals"
 *   "Health+"
 *   "Children's Supplements"
 *   "Herbal-Natural Extract"
 *
 * Examples rejected:
 *   "canaherb"              (lowercase start)
 *   "herbal Natural"        (first word lowercase)
 *   "Herbal natural"        (second word lowercase)
 *   "Ωmega Extract"         (unicode)
 */
const createProductSchema = Joi.object({
  name: validateString('Product Name', 2, 255),
  
  series: Joi.string()
    .trim()
    .allow(null, '')
    .pattern(BRAND_CATEGORY_REGEX)
    .min(2)
    .max(100)
    .messages({
      'string.pattern.base':
        `"series" must start each word with an uppercase letter and may include letters, digits, and symbols (', &, +, /, -).`,
    }),
  
  brand: Joi.string()
    .trim()
    .pattern(BRAND_CATEGORY_REGEX)
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.pattern.base':
        `"brand" must start each word with an uppercase letter and may include letters, digits, and symbols (', &, +, /, -).`,
    }),
  
  category: Joi.string()
    .trim()
    .pattern(BRAND_CATEGORY_REGEX)
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.pattern.base':
        `"category" must start each word with an uppercase letter and may include letters, digits, and symbols (', &, +, /, -).`,
    }),
  
  description: validateOptionalString('Description', 1000),
});

/**
 * @constant
 * @description
 * Joi validation schema for bulk product creation requests.
 *
 * Expected payload shape:
 *   {
 *     "products": [
 *       { ...single product fields... },
 *       { ... }
 *     ]
 *   }
 *
 * Validation rules:
 *  - `products` must be an array.
 *  - Minimum 1 product; maximum 200 products per request.
 *  - Each element in the array must satisfy `createProductSchema`,
 *    which validates:
 *       • Product name, brand, category
 *       • TitleCase / ALLCAPS word rules via BRAND_CATEGORY_REGEX
 *       • Optional fields (series, description, dimensions)
 *
 * Behavior notes:
 *  - Ensures the entire request body is well-formed before reaching the
 *    service layer.
 *  - Prevents oversized bulk operations that may impact database performance.
 *  - Works together with the controller to enforce clean input and avoid
 *    partially valid submissions.
 *
 * Typical usage:
 *   validate(createProductBulkSchema, 'body')
 *
 * Used by:
 *   - POST /products/create
 *   - Product creation tooling (bulk import UI, admin tools, integration APIs)
 */
const createProductBulkSchema = Joi.object({
  products: Joi.array()
    .items(createProductSchema)
    .min(1)
    .max(200)
    .required(),
});

module.exports = {
  productQuerySchema,
  productIdParamSchema,
  updateProductStatusSchema,
  productUpdateSchema,
  createProductBulkSchema,
};
