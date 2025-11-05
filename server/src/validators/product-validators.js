const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  validateOptionalString,
  validateOptionalUUID,
  validateUUID
} = require('./general-validators');

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

module.exports = {
  productQuerySchema,
  productIdParamSchema,
  productUpdateSchema,
};
