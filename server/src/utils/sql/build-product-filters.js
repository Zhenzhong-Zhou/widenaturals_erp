/**
 * @fileoverview
 * Product SQL filter builder.
 *
 * This module centralizes logic for dynamically generating parameterized SQL `WHERE`
 * clauses for querying the `products` table (joined with `statuses`).
 *
 * It ensures:
 * - Secure and reusable query generation for product listings, dashboards, and reports.
 * - Safe handling of user-supplied filters (prevents SQL injection via parameterization).
 * - Consistent, auditable filtering logic across repositories and services.
 *
 * ### Key Features
 * - Supports multiple filter types (status, brand, category, series, date range, etc.)
 * - Provides fuzzy keyword search across `p.name`, `p.brand`, `p.category`, and `s.name`
 * - Returns both the SQL `WHERE` clause and positional parameters array
 *
 * ### Example Usage
 * ```js
 * const { whereClause, params } = buildProductFilter({
 *   statusIds: ['uuid-1', 'uuid-2'],
 *   brand: 'Canaherb',
 *   keyword: 'Immune',
 *   createdAfter: '2025-01-01',
 * });
 *
 * // Produces:
 * // whereClause =>
 * // "1=1 AND p.status_id = ANY($1::uuid[]) AND p.brand ILIKE $2
 * //  AND (p.name ILIKE $3 OR p.brand ILIKE $3 OR p.category ILIKE $3 OR s.name ILIKE $3)
 * //  AND p.created_at >= $4"
 * //
 * // params => [ ['uuid-1','uuid-2'], '%Canaherb%', '%Immune%', '2025-01-01' ]
 * ```
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Builds a parameterized SQL WHERE clause for querying Products.
 *
 * Produces a SQL-safe WHERE clause using `$n` placeholders and
 * an aligned `params[]` array. Supports exact match, fuzzy match,
 * multi-status filtering, and date range filtering.
 *
 * ## Status Filter Priority
 * 1. `statusIds` (array of UUIDs)
 * 2. `status_id` (single UUID)
 * 3. `_activeStatusId` (enforced fallback)
 *
 * ## Supported Filters
 * | Field                | Type         | Description                                                |
 * |----------------------|--------------|------------------------------------------------------------|
 * | `statusIds`          | string[]     | Filter by multiple product status IDs                      |
 * | `status_id`          | string       | Filter by a single status ID                               |
 * | `_activeStatusId`    | string       | Forced fallback when user cannot view all statuses         |
 * | `brand`              | string       | Partial case-insensitive match                             |
 * | `category`           | string       | Partial case-insensitive match                             |
 * | `series`             | string       | Partial case-insensitive match                             |
 * | `createdBy`          | string       | Creator user ID                                            |
 * | `updatedBy`          | string       | Last update user ID                                        |
 * | `createdAfter`       | ISO string   | created_at >= timestamp                                    |
 * | `createdBefore`      | ISO string   | created_at <= timestamp                                    |
 * | `keyword`            | string       | Fuzzy match across name, brand, category, and series       |
 *
 * ## Returns
 * ```js
 * {
 *   whereClause: "1=1 AND p.brand ILIKE $1 AND p.status_id = ANY($2::uuid[])",
 *   params: ["%Omega%", ["uuid1","uuid2"]]
 * }
 * ```
 *
 * ## Throws
 * - `AppError.databaseError()` if any filter processing fails
 *
 * @param {Object} [filters={}] - Structured product filter criteria
 * @param {string[]} [filters.statusIds] - Product status UUIDs
 * @param {string} [filters.status_id] - Match by status id.
 * @param {string} [filters._activeStatusId] - Fallback enforced status.
 * @param {string} [filters.brand] - Partial brand name match
 * @param {string} [filters.category] - Partial category match
 * @param {string} [filters.series] - Partial series match
 * @param {string} [filters.createdBy] - User ID of creator
 * @param {string} [filters.updatedBy] - User ID of last updater
 * @param {string} [filters.createdAfter] - Lower date bound (ISO format)
 * @param {string} [filters.createdBefore] - Upper date bound (ISO format)
 * @param {string} [filters.keyword] - Keyword for fuzzy search
 *
 * @returns {{ whereClause: string, params: any[] }} SQL-safe WHERE clause and parameter list
 */
const buildProductFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let idx = 1;

    // Filter by status
    const statusFilterValue = filters.statusIds?.length
      ? filters.statusIds
      : filters.status_id
        ? filters.status_id
        : filters._activeStatusId;

    if (statusFilterValue !== undefined && statusFilterValue !== null) {
      if (Array.isArray(statusFilterValue)) {
        conditions.push(`p.status_id = ANY($${idx}::uuid[])`);
      } else {
        conditions.push(`p.status_id = $${idx}`);
      }

      params.push(statusFilterValue);
      idx++;
    }

    // Brand
    if (filters.brand) {
      conditions.push(`p.brand ILIKE $${idx}`);
      params.push(`%${filters.brand}%`);
      idx++;
    }

    // Category
    if (filters.category) {
      conditions.push(`p.category ILIKE $${idx}`);
      params.push(`%${filters.category}%`);
      idx++;
    }

    // Series
    if (filters.series) {
      conditions.push(`p.series ILIKE $${idx}`);
      params.push(`%${filters.series}%`);
      idx++;
    }

    // Created/Updated by
    if (filters.createdBy) {
      conditions.push(`p.created_by = $${idx}`);
      params.push(filters.createdBy);
      idx++;
    }

    if (filters.updatedBy) {
      conditions.push(`p.updated_by = $${idx}`);
      params.push(filters.updatedBy);
      idx++;
    }

    // Date ranges
    if (filters.createdAfter) {
      conditions.push(`p.created_at >= $${idx}`);
      params.push(filters.createdAfter);
      idx++;
    }

    if (filters.createdBefore) {
      conditions.push(`p.created_at <= $${idx}`);
      params.push(filters.createdBefore);
      idx++;
    }

    // Keyword search (fuzzy match)
    if (filters.keyword) {
      const likeParam = `%${filters.keyword}%`;

      const searchFields = ['p.name', 'p.brand', 'p.category'];

      const orConditions = searchFields
        .map((field) => `${field} ILIKE $${idx}`)
        .join(' OR ');

      conditions.push(`(${orConditions})`);
      params.push(likeParam);
      idx++;
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build product filter', {
      context: 'product-repository/buildProductFilter',
      error: err.message,
      filters,
    });
    throw AppError.databaseError('Failed to prepare product filter', {
      details: err.message,
      stage: 'build-product-where-clause',
    });
  }
};

module.exports = {
  buildProductFilter,
};
