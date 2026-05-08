/**
 * Filter input for warehouse_types queries.
 *
 * @typedef {Object} WarehouseTypeFilters
 * @property {boolean} [isActive]      - Filter by is_active flag (typically pinned by the business layer).
 * @property {string}  [keyword]       - ILIKE search on name.
 * @property {string}  [createdAfter]
 * @property {string}  [createdBefore]
 * @property {string}  [updatedAfter]
 * @property {string}  [updatedBefore]
 * @property {string}  [createdBy]
 * @property {string}  [updatedBy]
 */

/**
 * Raw row returned by getPaginatedWarehouseTypeLookup.
 *
 * @typedef {Object} WarehouseTypeLookupRow
 * @property {string}  id
 * @property {string}  name
 * @property {boolean} is_active
 */
