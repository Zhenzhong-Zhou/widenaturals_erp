/**
 * @file inventory-status-types.js
 * @description Type definitions for the inventory_status repository, queries, and transformers.
 *
 * Type-only — no runtime exports.
 *
 * Typedefs:
 *  - InventoryStatusFilters
 *  - InventoryStatusLookupRow
 *  - GetPaginatedInventoryStatusLookupOptions
 *  - InventoryStatusLookupItem
 */

'use strict';

/**
 * Filter shape accepted by buildInventoryStatusFilters.
 *
 * @typedef {Object} InventoryStatusFilters
 * @property {string[]} [ids]           - Restrict to these inventory_status UUIDs.
 * @property {string[]} [excludeIds]    - Exclude these inventory_status UUIDs.
 * @property {boolean}  [isActive]      - Filter by is_active flag.
 * @property {string}   [keyword]       - ILIKE search on name.
 * @property {string}   [createdAfter]  - Lower bound for created_at (inclusive, UTC).
 * @property {string}   [createdBefore] - Upper bound for created_at (exclusive, UTC).
 * @property {string}   [createdBy]     - Filter by creator UUID.
 * @property {string}   [updatedBy]     - Filter by updater UUID.
 */

/**
 * Raw row returned by buildInventoryStatusLookupQuery.
 *
 * @typedef {Object} InventoryStatusLookupRow
 * @property {string}  id
 * @property {string}  name
 * @property {boolean} is_active
 */

/**
 * Input options for getPaginatedInventoryStatusLookup.
 *
 * @typedef {Object} GetPaginatedInventoryStatusLookupOptions
 * @property {InventoryStatusFilters} [filters={}]
 * @property {number}                 [limit=50]
 * @property {number}                 [offset=0]
 */

/**
 * Transformed dropdown item returned to the API layer.
 *
 * @typedef {Object} InventoryStatusLookupItem
 * @property {string}  id         - Inventory status UUID.
 * @property {string}  label      - Display name (from `name` column).
 * @property {boolean} [isActive] - Only present when the caller has `canViewInactive`.
 */
