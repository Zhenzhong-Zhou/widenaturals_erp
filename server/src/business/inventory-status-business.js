/**
 * @file inventory-status-business.js
 * @description Business-layer ACL + filter resolution for inventory_status lookups.
 *
 * Exports:
 *  - evaluateInventoryStatusLookupVisibility — resolves a caller's visibility flags
 *  - resolveInventoryStatusLookupFilters     — applies ACL to caller-supplied filters
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');
const {
  INVENTORY_STATUS_CONSTANTS,
} = require('../utils/constants/domain/inventory-status-constants');

const CONTEXT = 'business/inventory-status-business';

/**
 * Evaluates a user's visibility into the inventory_status lookup.
 *
 * Currently, single-axis: callers without VIEW_ALL_INVENTORY_STATUS may
 * only see active rows. Root bypasses all checks.
 *
 * @param {AuthUser} user
 * @returns {Promise<InventoryStatusLookupAcl>}
 * @throws  {AppError} businessError - Unable to evaluate visibility.
 */
const evaluateInventoryStatusLookupVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateInventoryStatusLookupVisibility`;

  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);

    // ─── Status visibility ─────────────────────────────────────────────────────

    const canViewInactive =
      isRoot ||
      permissions.includes(
        INVENTORY_STATUS_CONSTANTS.PERMISSIONS.VIEW_ALL_INVENTORY_STATUS
      );

    return {
      canViewInactive,
    };
  } catch (err) {
    logSystemException(
      err,
      'Failed to evaluate inventory status lookup visibility',
      {
        context,
        userId: user?.id,
      }
    );

    throw AppError.businessError(
      'Unable to evaluate inventory status lookup visibility.'
    );
  }
};

/**
 * Applies inventory_status lookup ACL to caller-supplied filters.
 *
 * Pure function — no side effects on inputs. Restricted callers (no
 * `canViewInactive`) are pinned to active rows by forcing `isActive: true`,
 * which overrides any caller-supplied value.
 *
 * @param {InventoryStatusFilters}   filters
 * @param {InventoryStatusLookupAcl} acl
 * @returns {InventoryStatusFilters}
 */
const resolveInventoryStatusLookupFilters = (filters, acl) =>
  acl.canViewInactive ? filters : { ...filters, isActive: true };

module.exports = {
  evaluateInventoryStatusLookupVisibility,
  resolveInventoryStatusLookupFilters,
};
