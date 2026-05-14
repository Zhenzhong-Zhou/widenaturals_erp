/**
 * @file warehouse-business.js
 * @description Business logic layer for warehouse access control and visibility rules.
 *
 * Owns ACL evaluation and server-side filter enforcement for the warehouse domain.
 * Pure rule functions contain no try/catch — only evaluateWarehouseVisibility
 * catches because it calls resolveUserPermissionContext which may fail.
 *
 * Exports:
 *  - evaluateWarehouseVisibility      — resolves ACL flags from user permissions
 *  - applyWarehouseVisibilityRules    — injects server-side filter constraints from ACL
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const { WAREHOUSE_CONSTANTS } = require('../utils/constants/domain/warehouse-constants');
const { getStatusId } = require('../config/status-cache');

const CONTEXT = 'warehouse-business';

// ─── ACL Evaluation ───────────────────────────────────────────────────────────

/**
 * Resolves warehouse ACL flags from the requesting user's permissions.
 *
 * @param {AuthUser} user
 * @returns {Promise<WarehouseAcl>}
 * @throws {AppError} businessError if permission resolution fails.
 */
const evaluateWarehouseVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateWarehouseVisibility`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    const can = (key) => isRoot || permissions.includes(key);

    return {
      isRoot,
      canViewAll: can(WAREHOUSE_CONSTANTS.PERMISSIONS.VIEW_ALL),
      canViewSummary: can(WAREHOUSE_CONSTANTS.PERMISSIONS.VIEW_SUMMARY),
      canViewArchived: can(WAREHOUSE_CONSTANTS.PERMISSIONS.VIEW_ARCHIVED),
      canViewAllStatuses: can(
        WAREHOUSE_CONSTANTS.PERMISSIONS.VIEW_ALL_STATUSES
      ),
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate warehouse visibility ACL', {
      context,
      userId: user?.id,
    });

    throw AppError.businessError(
      'Unable to evaluate warehouse access at this time.'
    );
  }
};

// ─── Visibility Rules ─────────────────────────────────────────────────────────

/**
 * Injects server-side filter constraints based on resolved warehouse ACL flags.
 *
 * Restricted users are pinned to active status and excluded from archived records
 * unless their permissions explicitly allow it.
 *
 * @param {object}       filters - Raw filter object from the request.
 * @param {WarehouseAcl} acl
 * @returns {object} Adjusted filters with ACL constraints applied.
 */
const applyWarehouseVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };

  if (!acl.canViewAllStatuses) {
    adjusted.statusId = adjusted.statusId ?? getStatusId('warehouse_active');
  }

  if (!acl.canViewArchived) {
    adjusted.isArchived = false;
  }

  return adjusted;
};

/**
 * Resolves warehouse lookup filters based on the requesting user's permissions.
 *
 * Restricted users are pinned to the active warehouse status. Users without
 * archive visibility have `isArchived` forced to `false`.
 *
 * @param {AuthUser} user - Authenticated user making the request.
 * @param {object} [rawFilters={}] - Base filter object from the request.
 * @returns {Promise<object>} Adjusted filter object with permission-based rules applied.
 * @throws {AppError} businessError if permission resolution fails.
 */
const resolveWarehouseFiltersByPermission = async (user, rawFilters = {}) => {
  const context = `${CONTEXT}/resolveWarehouseFiltersByPermission`;
  
  try {
    const ctx = await resolveUserPermissionContext(user);
    const { permissions, isRoot } = ctx;
    
    const canViewAllStatuses =
      isRoot ||
      permissions.includes(WAREHOUSE_CONSTANTS.PERMISSIONS.VIEW_ALL_STATUSES);
    const canViewArchived =
      isRoot ||
      permissions.includes(WAREHOUSE_CONSTANTS.PERMISSIONS.VIEW_ARCHIVED);
    
    const resolvedFilters = { ...rawFilters };
    
    // Status visibility
    if (canViewAllStatuses) {
      delete resolvedFilters.statusId;
    } else if (!resolvedFilters.statusId) {
      resolvedFilters.statusId = getStatusId('warehouse_active');
    }

    // Default to excluding archived records for users without archive permission.
    if (!canViewArchived && resolvedFilters.isArchived === undefined) {
      resolvedFilters.isArchived = false;
    }

    return resolvedFilters;
  } catch (err) {
    logSystemException(
      err,
      'Failed to resolve warehouse filters by permission',
      { context, userId: user?.id }
    );

    throw AppError.businessError(
      'Failed to resolve warehouse filters by permission.'
    );
  }
};

module.exports = {
  evaluateWarehouseVisibility,
  applyWarehouseVisibilityRules,
  resolveWarehouseFiltersByPermission,
};
