const { checkPermissions } = require('../services/role-permission-service');
const { getStatusId } = require('../config/status-cache');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Resolves and sanitizes warehouse filters based on the user's permission level.
 *
 * Behavior:
 * - Regular users (without `view_all_warehouse_statuses`) are restricted to active warehouses only.
 * - Users without `view_archived_warehouses` cannot see archived records (enforces isArchived = false).
 *
 * @param {Object} user - Authenticated user object
 * @param {Object} rawFilters - Raw filters from request/query (e.g., statusId, isArchived)
 * @returns {Promise<Object>} - Final sanitized filter object based on permission level
 *
 * @throws {AppError} - If permission check or status resolution fails
 */
const resolveWarehouseFiltersByPermission = async (user, rawFilters = {}) => {
  try {
    const canViewAllStatuses = await checkPermissions(user, ['view_all_warehouse_statuses']);
    const canViewArchived = await checkPermissions(user, ['view_archived_warehouses']);
    
    const defaultActiveStatusId = getStatusId('warehouse_active');
    
    const resolvedFilters = { ...rawFilters };
    
    // Apply status restriction if not allowed to view all statuses
    if (canViewAllStatuses) {
      delete resolvedFilters.statusId;
    } else if (!resolvedFilters.statusId) {
      resolvedFilters.statusId = defaultActiveStatusId;
    }
    
    // Enforce isArchived = false if user is not allowed to view archived
    if (!canViewArchived && resolvedFilters.isArchived === undefined) {
      resolvedFilters.isArchived = false;
    }
    
    return resolvedFilters;
  } catch (error) {
    logSystemException(
      error,
      'Permission-based warehouse filter resolution failed. Please check user roles or status ID mapping.',
      {
        context: 'warehouse-business/resolveWarehouseFiltersByPermission',
        userId: user?.id,
        filters: rawFilters,
      }
    );
    
    throw AppError.businessError('Failed to resolve warehouse filters by permission.');
  }
};

module.exports = {
  resolveWarehouseFiltersByPermission
};
