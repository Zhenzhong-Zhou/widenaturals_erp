/**
 * @file warehouse-business.js
 * @description Domain business logic for warehouse filter resolution
 * based on user permissions.
 */

'use strict';

const {
  resolveUserPermissionContext,
} = require('../services/permission-service');
const { getStatusId }        = require('../config/status-cache');
const { logSystemException } = require('../utils/logging/system-logger');
const AppError               = require('../utils/AppError');

const CONTEXT = 'warehouse-business';

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
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canViewAllStatuses =
      isRoot || permissions.includes('view_all_warehouse_statuses');
    const canViewArchived =
      isRoot || permissions.includes('view_archived_warehouses');
    
    const resolvedFilters = { ...rawFilters };
    
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
  resolveWarehouseFiltersByPermission,
};
