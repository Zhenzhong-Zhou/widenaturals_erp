/**
 * @file inventory-action-type-business.js
 * @description Business logic layer for inventory action type lookup access
 * control and lookup-row decoration.
 *
 * Owns ACL evaluation, visibility rule enforcement, and active-flag
 * normalisation for the inventory action type lookup endpoint. Contains
 * no orchestration; the service layer owns query execution,
 * transformation, and cache resolution.
 *
 * Base read access is enforced by route-level authorize middleware. This
 * layer only resolves scope-level flags and applies the filter shaping
 * they imply.
 *
 * Exports:
 *  - evaluateInventoryActionTypeLookupVisibility - ACL for the lookup endpoint
 *  - resolveInventoryActionTypeLookupFilters     - pins active status for restricted callers
 *  - enrichInventoryActionTypeLookupRow          - decorates a lookup row with isActive
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const {
  INVENTORY_ACTION_TYPE_CONSTANTS,
} = require('../utils/constants/domain/inventory-action-type-constants');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');

const CONTEXT = 'inventory-action-type-business';

/**
 * Resolves the ACL for the inventory action type lookup endpoint.
 *
 * Returns one scope flag consumed downstream by the lookup workflow:
 *  - `canViewInactive` — true for root or holders of VIEW_ALL_STATUSES;
 *    bypasses the active-status pin in the resolver and enables the
 *    transformer to surface (and tag) inactive rows.
 *
 * Throws AppError.businessError if permission resolution fails.
 *
 * @param {Object} user - Authenticated user from req.auth.user.
 * @returns {Promise<InventoryActionTypeLookupAcl>}
 */
const evaluateInventoryActionTypeLookupVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateInventoryActionTypeLookupVisibility`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    return {
      canViewInactive:
        isRoot ||
        permissions.includes(
          INVENTORY_ACTION_TYPE_CONSTANTS.PERMISSIONS.VIEW_ALL_STATUSES
        ),
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate inventory action type lookup visibility',
      { context, userId: user?.id }
    );
    throw AppError.businessError(
      'Unable to evaluate inventory action type lookup visibility.'
    );
  }
};

/**
 * Applies inventory action type lookup ACL to caller-supplied filters.
 *
 * Pure function — no side effects on inputs. Without `canViewInactive`,
 * `statusId` is forced to the supplied active id, overriding any
 * caller-supplied value. Privileged callers retain whatever was passed in.
 *
 * @param {InventoryActionTypeFilters}   filters
 * @param {InventoryActionTypeLookupAcl} acl
 * @param {string}                       activeStatusId - Cached id for the active status.
 * @returns {InventoryActionTypeFilters}
 */
const resolveInventoryActionTypeLookupFilters = (
  filters,
  acl,
  activeStatusId
) => {
  const next = { ...filters };
  if (!acl.canViewInactive) next.statusId = activeStatusId;
  return next;
};

/**
 * Decorates an inventory action type lookup row with a normalised
 * `isActive` boolean flag computed by comparing `status_id` against
 * the cached active status id.
 *
 * @param {InventoryActionTypeRow} row
 * @param {string}                 activeStatusId - Cached id for the active status.
 * @returns {InventoryActionTypeRow & { isActive: boolean }}
 */
const enrichInventoryActionTypeLookupRow = (row, activeStatusId) => ({
  ...row,
  isActive: row.status_id === activeStatusId,
});

module.exports = {
  evaluateInventoryActionTypeLookupVisibility,
  resolveInventoryActionTypeLookupFilters,
  enrichInventoryActionTypeLookupRow,
};
