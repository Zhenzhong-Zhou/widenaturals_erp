const {
  canViewInventoryLogs,
  canViewAllInventoryLogs,
  canViewAllWarehouses,
  canViewAllLocations,
  canViewAllActionTypes,
  canViewAllProducts,
  canViewAllSkus,
  getUserAllowedWarehouses,
  getUserAllowedLocations,
  getUserAllowedProducts,
  getUserAllowedSkus,
  getUserAllowedActionTypes,
} = require('../business/reports/inventory-activity-report-business');
const { getInventoryActivityLogs } = require('../repositories/reports/inventory-activity-report');
const { transformInventoryActivityLogs } = require('../transformers/reports/inventory-activity-report-transformer');
const { logSystemError } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Service: Fetch and transform inventory activity logs for reporting
 *
 * @param {Object} params
 * @param {Object} params.filters - Filtering options (e.g., warehouseIds, skuIds, date range)
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Records per page
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>}
 */
const fetchInventoryActivityLogsService = async ({ filters = {}, page = 1, limit = 20 } = {}, user) => {
  try {
    // Check baseline access
    if (!(await canViewInventoryLogs(user))) {
      throw AppError.authorizationError('You are not allowed to view inventory logs.');
    }
    
    let finalLimit = limit;
    
    // Optional filter scoping: only apply filters if user lacks full permission
    const scopedFilters = {
      ...filters,
    };
    
    if (!(await canViewAllInventoryLogs(user))) {
      const permissionChecks = [
        { key: 'warehouseIds', check: canViewAllWarehouses },
        { key: 'locationIds', check: canViewAllLocations },
        { key: 'productIds', check: canViewAllProducts },
        { key: 'skuIds', check: canViewAllSkus },
        { key: 'actionTypeIds', check: canViewAllActionTypes },
      ];
      
      for (const { key, check } of permissionChecks) {
        if (!filters[key]?.length && !(await check(user))) {
          scopedFilters[key] = [];
        }
      }
      
      finalLimit = Math.min(finalLimit, 30); // limit results for restricted access
    }
    
    const rawResult = await getInventoryActivityLogs({
      filters: scopedFilters,
      page,
      limit: finalLimit,
    });
    
    return transformInventoryActivityLogs(rawResult);
  } catch (error) {
    logSystemError('Failed to fetch inventory activity logs', {
      context: 'fetchInventoryActivityLogsService',
      error,
      filters,
    });
    throw AppError.serviceError('Unable to retrieve inventory activity log report.');
  }
};

module.exports = {
  fetchInventoryActivityLogsService,
};
