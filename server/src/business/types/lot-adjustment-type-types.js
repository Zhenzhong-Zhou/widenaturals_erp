/**
 * @file lot-adjustment-type-types.js
 * @description JSDoc typedefs for lot adjustment type records,
 * filters, and business-layer ACL.
 */

/**
 * Raw lot adjustment type row as returned from the lookup query
 * (joined with inventory_action_types).
 *
 * @typedef {Object} LotAdjustmentTypeRow
 * @property {string}  lot_adjustment_type_id     - Lot adjustment type UUID.
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

/**
 * ACL flags produced by evaluateLotAdjustmentTypeLookupVisibility and
 * consumed downstream by the filter resolver, row enricher, and
 * transformer flag map.
 *
 * The two flags are independent — admins can hold one without the other.
 *
 * @typedef {Object} LotAdjustmentTypeLookupAcl
 * @property {boolean} canViewInactive - True for root or holders of VIEW_ALL_STATUSES.
 *                                       Bypasses the `isActive: true` pin and surfaces
 *                                       the `isActive` tag on transformed rows.
 * @property {boolean} canViewInternal - True for root or holders of VIEW_INTERNAL.
 *                                       Bypasses the `excludeNames` pin so internal
 *                                       stock-management types appear in results
 *                                       (still within the adjustment category).
 */
