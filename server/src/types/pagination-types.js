/**
 * @file pagination-types.js
 * @description Shared pagination result typedefs returned by db-paginate utilities.
 *
 * Type-only — no runtime exports.
 *
 * Typedefs:
 *  - PaginatedPageResult<T>   — returned by paginateQuery (page-based)
 *  - PaginatedOffsetResult<T> — returned by paginateQueryByOffset (offset-based)
 */

'use strict';

/**
 * Page-based paginated result.
 *
 * @template T
 * @typedef {Object} PaginatedPageResult
 * @property {T[]} data
 * @property {{
 *   page: number,
 *   limit: number,
 *   totalRecords: number | null,
 *   totalPages: number | null
 * }} pagination
 */

/**
 * Offset-based paginated result.
 *
 * @template T
 * @typedef {Object} PaginatedOffsetResult
 * @property {T[]} data
 * @property {{
 *   offset: number,
 *   limit: number,
 *   totalRecords: number | null,
 *   hasMore: boolean
 * }} pagination
 */
