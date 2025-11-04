const Joi = require('joi');
const {
  paginationSchema,
  createSortSchema,
  validateOptionalString,
  validateOptionalUUID
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

module.exports = {
  productQuerySchema,
};
