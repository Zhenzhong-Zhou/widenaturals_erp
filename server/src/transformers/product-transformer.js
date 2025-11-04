/**
 * @fileoverview
 * Transforms raw SQL product rows into clean, API-ready objects.
 *
 * Used by:
 * - `getPaginatedProducts` repository function
 * - Product listing, dashboard, and admin detail APIs
 *
 * ### Input
 * A flat SQL row returned from the `products` query with:
 * - Core fields (`id`, `name`, `series`, `brand`, `category`, `description`)
 * - Status info (`status_id`, `status_name`, `status_date`)
 * - Audit info (`created_at`, `updated_at`, `created_by`, `updated_by`, and user names)
 *
 * ### Output
 * A normalized object with nested structure:
 * ```js
 * {
 *   id,
 *   name,
 *   series,
 *   brand,
 *   category,
 *   description,
 *   status: { id, name, date },
 *   audit: {
 *     createdAt,
 *     createdBy: { id, fullName },
 *     updatedAt,
 *     updatedBy: { id, fullName },
 *   }
 * }
 * ```
 */

const { cleanObject } = require('../utils/object-utils');
const { transformPaginatedResult } = require('../utils/transformer-utils');

/**
 * Transforms a single raw product SQL row into a clean, API-ready object.
 *
 * @param {Record<string, any>} row - Raw SQL row from `getPaginatedProducts`
 * @returns {Record<string, any>} Normalized product object
 */
const transformProductRow = (row) => {
  const base = {
    id: row.id,
    name: row.name,
    series: row.series ?? null,
    brand: row.brand ?? null,
    category: row.category ?? null,
    status: {
      id: row.status_id,
      name: row.status_name ?? null,
      date: row.status_date ?? null,
    },
    audit: {
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
  
  return cleanObject(base);
};

/**
 * Transforms a paginated result of product rows into API-ready format.
 *
 * Wraps `transformProductRow` for each item and preserves pagination metadata.
 *
 * ### Input
 * ```js
 * {
 *   data: [SQLRow, SQLRow, ...],
 *   pagination: { page, limit, totalRecords, totalPages }
 * }
 * ```
 *
 * ### Output
 * ```js
 * {
 *   data: [TransformedProduct, ...],
 *   pagination: { page, limit, totalRecords, totalPages }
 * }
 * ```
 *
 * @param {{
 *   data: Record<string, any>[];
 *   pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
 * }} paginatedResult - Raw paginated query result
 * @returns {{
 *   data: Record<string, any>[];
 *   pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
 * }} Cleaned paginated product results
 */
const transformPaginatedProductResults = (paginatedResult) => {
  return transformPaginatedResult(paginatedResult, (row) =>
    transformProductRow(row)
  );
};

module.exports = {
  transformPaginatedProductResults,
};
