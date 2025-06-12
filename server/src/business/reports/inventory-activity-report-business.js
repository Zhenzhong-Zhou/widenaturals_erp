const { checkPermissions } = require('../../services/role-permission-service');

/**
 * Determines if the user has basic access to inventory activity logs.
 * Allows viewing limited or scoped activity logs (e.g., own actions or assigned entities).
 */
const canViewInventoryLogs = async (user) => {
  return await checkPermissions(user, ['view_inventory_logs', 'root_access']);
};

/**
 * Determines if the user can access inventory logs across all warehouses.
 * Grants unrestricted access to the warehouse filter in reports.
 */
const canViewAllWarehouses = async (user) => {
  return await checkPermissions(user, ['view_all_warehouses', 'root_access']);
};

/**
 * Determines if the user can access inventory logs across all locations.
 * Grants unrestricted access to the location filter in reports.
 */
const canViewAllLocations = async (user) => {
  return await checkPermissions(user, ['view_all_locations', 'root_access']);
};

/**
 * Determines if the user can view all inventory action types in logs.
 * Grants unrestricted access to the inventory_action_type_id filter in reports.
 */
const canViewAllActionTypes = async (user) => {
  return await checkPermissions(user, ['view_all_action_types', 'root_access']);
};

/**
 * Determines if the user can access inventory logs for all products.
 * Used to bypass product-level filtering in activity reports.
 */
const canViewAllProducts = async (user) => {
  return await checkPermissions(user, ['view_all_products', 'root_access']);
};

/**
 * Determines if the user can access inventory logs across all SKUs.
 */
const canViewAllSkus = async (user) => {
  return await checkPermissions(user, ['view_all_skus', 'root_access']);
};

/**
 * Determines if the user can access all inventory activity logs without restriction.
 * Applies to full-report access across all filters and entities.
 */
const canViewAllInventoryLogs = async (user) => {
  return await checkPermissions(user, ['view_all_inventory_logs', 'root_access']);
};

module.exports = {
  canViewInventoryLogs,
  canViewAllWarehouses,
  canViewAllLocations,
  canViewAllActionTypes,
  canViewAllProducts,
  canViewAllSkus,
  canViewAllInventoryLogs,
};
