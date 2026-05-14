/**
 * @file lot-adjustment-type-types.js
 * @description JSDoc typedefs for lot adjustment type records.
 */

/**
 * Raw lot adjustment type row as returned from the lookup query
 * (joined with inventory_action_types).
 *
 * @typedef {Object} LotAdjustmentTypeRow
 * @property {string}  id                         - Lot adjustment type UUID.
 * @property {string}  name                       - Lot adjustment type display name.
 * @property {string}  code                       - Lot adjustment type code.
 * @property {boolean} is_active                  - Whether this type is active.
 * @property {string}  inventory_action_type_id   - Parent action type UUID.
 * @property {string}  inventory_action_type_name - Parent action type display name.
 * @property {string}  category                   - Parent action type category.
 */

/**
 * Filters accepted by buildLotAdjustmentTypeFilter.
 *
 * @typedef {Object} LotAdjustmentTypeFilters
 * @property {string[]} [ids]
 * @property {boolean}  [isActive]
 * @property {string}   [inventoryActionTypeId]
 * @property {string[]} [actionTypeCategories]
 * @property {string[]} [excludeNames]
 * @property {string}   [group]
 * @property {string}   [departmentGroup]
 * @property {string}   [createdBy]
 * @property {string}   [updatedBy]
 * @property {string}   [createdAfter]
 * @property {string}   [createdBefore]
 * @property {string}   [updatedAfter]
 * @property {string}   [updatedBefore]
 * @property {string}   [name]
 * @property {string}   [code]
 * @property {string}   [description]
 * @property {string}   [keyword]
 */
