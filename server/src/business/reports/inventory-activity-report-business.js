const { checkPermissions } = require('../../services/role-permission-service');
const AppError = require('../../utils/AppError');
const { enforceAllowedFilters, hasValidFilters } = require('../../utils/inventory-log-utils');

/**
 * Rejects scoped users if no valid filters are provided.
 * Optionally also enforces allowed filters if `allowedKeys` are provided.
 *
 * @param {Object} scope - User inventory access scope
 * @param {Object} filters - Filters passed in
 * @param {string[]} [allowedKeys] - Optional list of allowed filter keys
 * @throws {AppError.AuthorizationError}
 */
const rejectEmptyFiltersForScopedAccess = (scope, filters, allowedKeys = null) => {
  const isScopedUser = !scope.hasFullAccess;
  
  if (allowedKeys) {
    enforceAllowedFilters(filters, allowedKeys);
  }
  
  if (isScopedUser && !hasValidFilters(filters)) {
    throw AppError.authorizationError(
      'You must provide at least one valid filter to access inventory activity logs.'
    );
  }
};

/**
 * Checks if the user has full access to all inventory logs.
 * Grants unrestricted access across all filters and actions.
 *
 * @param {Object} user - Authenticated user object
 * @returns {Promise<boolean>}
 */
const hasFullInventoryLogAccess = async (user) => {
  return await checkPermissions(user, [
    'view_full_inventory_logs',
    'admin_access',
    'root_access',
  ]);
};

/**
 * Checks if the user can view inventory logs for all products.
 * Used to bypass product-level filtering.
 *
 * @param {Object} user
 * @returns {Promise<boolean>}
 */
const canViewProductLevelLogs = async (user) => {
  return await checkPermissions(user, ['view_all_products', 'root_access']);
};

/**
 * Checks if the user can view inventory logs for all SKUs.
 *
 * @param {Object} user
 * @returns {Promise<boolean>}
 */
const canViewSkuLevelLogs = async (user) => {
  return await checkPermissions(user, ['view_all_skus', 'root_access']);
};

/**
 * Checks if the user can view inventory logs for all batches.
 *
 * @param {Object} user
 * @returns {Promise<boolean>}
 */
const canViewBatchLevelLogs = async (user) => {
  return await checkPermissions(user, ['view_all_batches', 'root_access']);
};

/**
 * Checks if the user can view logs related to all packing materials.
 * Grants unrestricted access to packaging material filters.
 *
 * @param {Object} user
 * @returns {Promise<boolean>}
 */
const canViewAllPackingMaterials = async (user) => {
  return await checkPermissions(user, ['view_all_packing_materials', 'root_access']);
};

/**
 * Checks if the user can view logs across all warehouse locations.
 * Grants unrestricted access to the warehouse filter.
 *
 * @param {Object} user
 * @returns {Promise<boolean>}
 */
const canViewAllWarehouses = async (user) => {
  return await checkPermissions(user, ['view_all_warehouses', 'root_access']);
};

/**
 * Checks if the user can view logs across all physical locations.
 * Grants unrestricted access to the location filter.
 *
 * @param {Object} user
 * @returns {Promise<boolean>}
 */
const canViewAllLocations = async (user) => {
  return await checkPermissions(user, ['view_all_locations', 'view_full_warehouse_logs', 'root_access']);
};

/**
 * Determines the user's inventory access scope for activity log filters.
 * Maps access levels to permission tiers used in PERMISSION_FILTERS_MAP.
 *
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} Access scope flags and the derived permissionKey.
 */
const getUserInventoryAccessScope = async (user) => {
  const hasFullAccess = await hasFullInventoryLogAccess(user);
  const hasProductAccess = await canViewProductLevelLogs(user);
  const hasSkuAccess = await canViewSkuLevelLogs(user);
  const hasBatchAccess = await canViewBatchLevelLogs(user);
  const hasPackingMaterialAccess = await canViewAllPackingMaterials(user);
  const hasLocationAccess = await canViewAllLocations(user);
  const hasWarehouseAccess = await canViewAllWarehouses(user);
  
  const isBaseAccess = !hasFullAccess &&
    !hasProductAccess &&
    !hasSkuAccess &&
    !hasBatchAccess &&
    !hasPackingMaterialAccess &&
    !hasLocationAccess &&
    !hasWarehouseAccess;
  
  return {
    hasFullAccess,
    hasProductAccess,
    hasSkuAccess,
    hasBatchAccess,
    hasPackingMaterialAccess,
    hasLocationAccess,
    hasWarehouseAccess,
    isBaseAccess,
  };
};

module.exports = {
  getUserInventoryAccessScope,
  rejectEmptyFiltersForScopedAccess,
};
