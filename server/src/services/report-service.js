const {
  getUserInventoryAccessScope, rejectEmptyFiltersForScopedAccess,
} = require('../business/reports/inventory-activity-report-business');
const { getInventoryActivityLogs, getLatestFilteredInventoryActivityLogs, getSkuIdsByProductIds,
  getBatchIdsByProductIds
} = require('../repositories/reports/inventory-activity-report');
const { transformInventoryActivityLogs, transformFlatInventoryActivityLogs } = require('../transformers/reports/inventory-activity-report-transformer');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { enforceAllowedFilters } = require('../utils/inventory-log-utils');
const { PERMISSION_FILTERS_MAP } = require('../utils/inventory-permission-mapping');

/**
 * Service: Fetch and transform inventory activity logs for reporting.
 *
 * Core Responsibilities:
 * - Determine the user's inventory access scope (e.g., full, product, SKU, warehouse, etc.)
 * - Enforce filter-level permission validation based on scope
 * - Reject requests with missing or unauthorized filters for scoped users
 * - Support optimized handling for base-level access (limited filter and record constraints)
 * - Retrieve and transform log data from repository based on valid filter input
 *
 * @param {Object} params - Parameters for the report.
 * @param {Object} params.filters - Filtering options (e.g., warehouseIds, skuIds, batchIds, date range).
 * @param {number} [params.page=1] - Page number for pagination.
 * @param {number} [params.limit=20] - Number of records per page.
 * @param {Object} user - Authenticated user object.
 * @returns {Promise<Object>} Transformed inventory activity logs with pagination metadata.
 *
 * @throws {AppError.AuthorizationError} If permission is denied or filters are invalid.
 * @throws {AppError.serviceError} If the logs could not be retrieved due to internal issues.
 */
const fetchInventoryActivityLogsService = async ({ filters = {}, page = 1, limit = 20 } = {}, user) => {
  try {
    const scope = await getUserInventoryAccessScope(user);
    
    let permissionKey = 'base';
    if (scope.hasFullAccess) permissionKey = 'full';
    else if (scope.hasProductAccess) permissionKey = 'product';
    else if (scope.hasSkuAccess) permissionKey = 'sku';
    else if (scope.hasBatchAccess) permissionKey = 'batch';
    else if (scope.hasWarehouseAccess) permissionKey = 'warehouse';
    else if (scope.hasLocationAccess) permissionKey = 'location';
    
    const allowedKeys = PERMISSION_FILTERS_MAP[permissionKey];
    
    // Full access: allow everything
    if (allowedKeys.includes('*')) {
      const result = await getInventoryActivityLogs({ filters, page, limit });
      return transformInventoryActivityLogs(result);
    }
    
    // Base permission specific logic
    if (permissionKey === 'base') {
      if (limit > 30) {
        throw AppError.authorizationError('You do not have permission to request more than 30 records.');
      }
      
      const { batchIds = [] } = filters;
      enforceAllowedFilters(filters, PERMISSION_FILTERS_MAP.base);
      
      if (batchIds.length > 0 && !scope.hasBatchAccess) {
        throw AppError.authorizationError('You do not have permission to view activity logs for this batch.');
      }
      
      const limitedResult = await getLatestFilteredInventoryActivityLogs({
        filters: batchIds.length > 0 ? { batchIds } : {},
        limit,
      });
      return transformFlatInventoryActivityLogs(limitedResult);
    }
    
    // Validate allowed filters and ensure scoped users provide at least one meaningful filter
    rejectEmptyFiltersForScopedAccess(scope, filters, allowedKeys);
    
    // Dependency enforcement for warehouse scope
    if (scope.hasWarehouseAccess && !scope.hasFullAccess) {
      const { warehouseIds = [], productIds = [], skuIds = [], batchIds = [] } = filters;
      
      if (
        warehouseIds.length === 0 &&
        (productIds.length > 0 || skuIds.length > 0 || batchIds.length > 0)
      ) {
        throw AppError.authorizationError(
          'You must specify warehouseIds when using product, SKU, or batch filters.'
        );
      }
    }

    // Dependency enforcement for location scope
    if (scope.hasLocationAccess && !scope.hasFullAccess) {
      const { locationIds = [], productIds = [], skuIds = [], batchIds = [] } = filters;
      
      if (
        locationIds.length === 0 &&
        (productIds.length > 0 || skuIds.length > 0 || batchIds.length > 0)
      ) {
        throw AppError.authorizationError(
          'You must specify locationIds when using product, SKU, or batch filters.'
        );
      }
    }
    
    const isProductScopedOnly =
      scope.hasProductAccess &&
      !scope.hasFullAccess &&
      !scope.hasSkuAccess &&
      !scope.hasBatchAccess &&
      !scope.hasWarehouseAccess &&
      !scope.hasLocationAccess;
    
    if (isProductScopedOnly) {
      const { productIds = [], skuIds = [], batchIds = [] } = filters;
      
      const allowedSkuIds = await getSkuIdsByProductIds(productIds);
      const allowedBatchIds = await getBatchIdsByProductIds(productIds);
      
      const invalidSku = skuIds?.some(id => !allowedSkuIds.includes(id));
      const invalidBatch = batchIds?.some(id => !allowedBatchIds.includes(id));
      
      if (invalidSku || invalidBatch) {
        throw AppError.authorizationError('Some SKUs or batches are outside your product access.');
      }
    }
    
    // If valid, run a full query
    const rawResult = await getInventoryActivityLogs({ filters, page, limit });
    return transformInventoryActivityLogs(rawResult);
  } catch (error) {
    if (error?.type === 'AuthorizationError') throw error;
    
    logSystemException(error,  'Failed to fetch inventory activity logs', {
      context: 'report-service/fetchInventoryActivityLogsService',
      filters,
    });
    
    throw AppError.serviceError('Unable to retrieve inventory activity log report.');
  }
};

module.exports = {
  fetchInventoryActivityLogsService,
};
