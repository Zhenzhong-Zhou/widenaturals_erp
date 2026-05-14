/**
 * @file inventory-action-type-types.js
 * @description JSDoc typedefs for inventory action type records,
 * filters, and business-layer ACL.
 */

/**
 * Raw inventory action type row as returned from the lookup query.
 *
 * @typedef {Object} InventoryActionTypeRow
 * @property {string}  id                 - Action type UUID.
 * @property {string}  name               - Display name.
 * @property {string}  category           - Category (e.g. 'adjustment', 'transaction', 'system').
 * @property {string}  status_id          - Status UUID (compared against active status id for isActive).
 * @property {boolean} is_adjustment      - Whether this action represents an adjustment.
 * @property {boolean} affects_financials - Whether this action impacts financial records.
 * @property {boolean} requires_audit     - Whether this action triggers audit logging.
 * @property {boolean} default_action     - Whether this is a non-deletable default action.
 */

/**
 * Filters accepted by buildInventoryActionTypeFilter.
 *
 * @typedef {Object} InventoryActionTypeFilters
 * @property {string[]} [ids]
 * @property {string[]} [categories]
 * @property {boolean}  [isAdjustment]
 * @property {boolean}  [affectsFinancials]
 * @property {boolean}  [requiresAudit]
 * @property {boolean}  [defaultAction]
 * @property {string}   [statusId]
 * @property {string}   [createdBy]
 * @property {string}   [updatedBy]
 * @property {string}   [createdAfter]
 * @property {string}   [createdBefore]
 * @property {string}   [updatedAfter]
 * @property {string}   [updatedBefore]
 * @property {string}   [name]
 * @property {string}   [description]
 * @property {string}   [keyword]
 */

/**
 * ACL flags produced by evaluateInventoryActionTypeLookupVisibility and
 * consumed downstream by the filter resolver, row enricher, and
 * transformer flag map.
 *
 * @typedef {Object} InventoryActionTypeLookupAcl
 * @property {boolean} canViewInactive - True for root or holders of VIEW_ALL_STATUSES.
 *                                       Bypasses the active-status pin and surfaces
 *                                       the `isActive` tag on transformed rows.
 */
