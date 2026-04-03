/**
 * @file transformer-types.js
 * @description JSDoc typedefs for transformer utilities.
 *
 * Shared across all transformer files and utility functions that
 * produce or consume paginated or load-more result shapes.
 */

'use strict';

/**
 * Generic paginated transformation result.
 *
 * @template T
 * @typedef {Object} PaginatedResult
 * @property {T[]} data
 * @property {{
 *   page: number,
 *   limit: number,
 *   totalRecords: number,
 *   totalPages: number
 * }} pagination
 */

/**
 * Generic load-more pagination result.
 *
 * @template T
 * @typedef {Object} LoadMoreResult
 * @property {T[]}     items   - Transformed result items.
 * @property {number}  offset  - Current query offset.
 * @property {number}  limit   - Maximum number of items returned.
 * @property {boolean} hasMore - Whether more records exist beyond this page.
 */

/**
 * Generic paginated query result returned from repository functions.
 *
 * @template T
 * @typedef {Object} PaginatedQueryResult
 * @property {T[]} data - Array of raw rows returned by the query.
 * @property {{
 *   page?: number,
 *   limit?: number,
 *   totalRecords?: number,
 *   offset?: number
 * }} [pagination] - Optional pagination metadata.
 */

/**
 * Generic lookup item used by dropdowns and autocomplete components.
 *
 * @typedef {Object} LookupItem
 * @property {string}  id
 * @property {string}  label
 * @property {string}  [subLabel]
 * @property {boolean} [isActive]
 */

/**
 * Access control context passed to flag-inclusion utilities.
 *
 * Each boolean key controls whether a corresponding diagnostic flag
 * is included in the lookup row output.
 *
 * @typedef {Object} LookupAccessControl
 * @property {boolean} [canViewAllStatuses=false]     - Exposes `isActive`.
 * @property {boolean} [canViewAllValidLookups=false] - Exposes `isValidToday`.
 * @property {boolean} [allowAllSkus=false]           - Exposes `isNormal` and `issueReasons`.
 * @property {boolean} [canViewArchived=false]        - Exposes `isArchived`.
 */

/**
 * Flag map passed to `includeFlagsBasedOnAccess`.
 *
 * Maps ACL key names to row property names. When the ACL key is truthy
 * on the user access object, the corresponding row property is included
 * in the output.
 *
 * @typedef {Object.<string, string>} FlagMap
 *
 * @example
 * const flagMap = {
 *   canViewAllStatuses:     'isActive',
 *   canViewAllValidLookups: 'isValidToday',
 *   canViewArchived:        'isArchived',
 * };
 */
