/**
 * @file inventory-activity-report-service.js
 * @description Business logic for inventory activity log report retrieval.
 *
 * Exports:
 *   - fetchInventoryActivityLogsService – fetches and transforms inventory activity logs
 *     with access-scoped filtering and permission enforcement
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const {
  getUserInventoryAccessScope,
  rejectEmptyFiltersForScopedAccess,
}                                        = require('../business/reports/inventory-activity-report-business');
const {
  getInventoryActivityLogs,
  getLatestFilteredInventoryActivityLogs,
  getSkuIdsByProductIds,
  getBatchIdsBySourceIds,
}                                        = require('../repositories/reports/inventory-activity-report');
const {
  transformInventoryActivityLogs,
  transformFlatInventoryActivityLogs,
}                                        = require('../transformers/reports/inventory-activity-report-transformer');
const AppError                           = require('../utils/AppError');
const { enforceAllowedFilters }          = require('../utils/inventory-log-utils');
const { PERMISSION_FILTERS_MAP }         = require('../utils/inventory-permission-mapping');

const CONTEXT = 'inventory-activity-report-service';

/**
 * Maps a resolved access scope to a permission key for filter map lookup.
 *
 * @param {Object} scope - Resolved user inventory access scope.
 * @returns {string} Permission key matching a `PERMISSION_FILTERS_MAP` entry.
 */
const determinePermissionKey = (scope) => {
  if (scope.hasFullAccess)            return 'full';
  if (scope.hasProductAccess)         return 'product';
  if (scope.hasSkuAccess)             return 'sku';
  if (scope.hasPackingMaterialAccess) return 'packing_material';
  if (scope.hasBatchAccess)           return 'batch';
  if (scope.hasWarehouseAccess)       return 'warehouse';
  if (scope.hasLocationAccess)        return 'location';
  return 'base';
};

/**
 * Fetches inventory activity logs with access-scoped filter enforcement.
 *
 * Resolves the user's access scope, applies permission-based filter validation,
 * queries the appropriate repository function, and transforms results.
 *
 * @param {Object}        user
 * @param {Object}        [options={}]
 * @param {Object}        [options.filters={}]              - Field filters to apply.
 * @param {number}        [options.page=1]                  - Page number (1-based).
 * @param {number}        [options.limit=20]                - Records per page.
 * @param {string}        [options.sortBy='actionTimestamp'] - Sort field key.
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']        - Sort direction.
 *
 * @returns {Promise<PaginatedResult<Object>|{ data: Array<Object> }>}
 *
 * @throws {AppError} `authorizationError` – permission violations on filters or record limit.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchInventoryActivityLogsService = async (
  user,
  {
    filters   = {},
    page      = 1,
    limit     = 20,
    sortBy    = 'actionTimestamp',
    sortOrder = 'DESC',
  } = {}
) => {
  const context = `${CONTEXT}/fetchInventoryActivityLogsService`;
  
  try {
    const scope         = await getUserInventoryAccessScope(user);
    const permissionKey = determinePermissionKey(scope);
    const allowedKeys   = PERMISSION_FILTERS_MAP[permissionKey];
    
    // Full access — no filter restrictions.
    if (allowedKeys.includes('*')) {
      const result = await getInventoryActivityLogs({ filters, page, limit, sortBy, sortOrder });
      return transformInventoryActivityLogs(result);
    }
    
    // Base access — limited record count and optional batch filter only.
    if (permissionKey === 'base') {
      if (limit > 30) {
        throw AppError.authorizationError(
          'You do not have permission to request more than 30 records.'
        );
      }
      
      const { batchIds = [] } = filters;
      enforceAllowedFilters(filters, allowedKeys);
      
      if (batchIds.length > 0 && !scope.hasBatchAccess) {
        throw AppError.authorizationError(
          'You do not have permission to view activity logs for this batch.'
        );
      }
      
      const result = await getLatestFilteredInventoryActivityLogs({
        filters: batchIds.length > 0 ? { batchIds } : {},
        limit,
      });
      return transformFlatInventoryActivityLogs(result);
    }
    
    // Scoped access — enforce non-empty filters based on permission level.
    rejectEmptyFiltersForScopedAccess(scope, filters, allowedKeys);
    
    const {
      productIds         = [],
      skuIds             = [],
      batchIds           = [],
      packingMaterialIds = [],
      warehouseIds       = [],
      locationIds        = [],
    } = filters;
    
    const dependentFilters =
      productIds.length + skuIds.length + batchIds.length + packingMaterialIds.length > 0;
    
    // Warehouse-scoped: must specify warehouseIds when using item-level filters.
    if (scope.hasWarehouseAccess && !scope.hasFullAccess && dependentFilters && warehouseIds.length === 0) {
      throw AppError.authorizationError(
        'You must specify warehouseIds when using product, SKU, batch, or packing material filters.'
      );
    }
    
    // Location-scoped: must specify locationIds when using item-level filters.
    if (scope.hasLocationAccess && !scope.hasFullAccess && dependentFilters && locationIds.length === 0) {
      throw AppError.authorizationError(
        'You must specify locationIds when using product, SKU, batch, or packing material filters.'
      );
    }
    
    // Product-scoped: validate SKU and batch IDs are within product access.
    if (
      scope.hasProductAccess &&
      !scope.hasFullAccess &&
      !scope.hasSkuAccess &&
      !scope.hasBatchAccess &&
      !scope.hasWarehouseAccess &&
      !scope.hasLocationAccess &&
      !scope.hasPackingMaterialAccess
    ) {
      const allowedSkuIds   = await getSkuIdsByProductIds(productIds);
      const allowedBatchIds = await getBatchIdsBySourceIds(productIds);
      
      if (
        skuIds.some((id) => !allowedSkuIds.includes(id)) ||
        batchIds.some((id) => !allowedBatchIds.includes(id))
      ) {
        throw AppError.authorizationError('Some SKUs or batches are outside your product access.');
      }
    }
    
    // Packing material-scoped: validate batch IDs are within packing material access.
    if (
      scope.hasPackingMaterialAccess &&
      !scope.hasFullAccess &&
      !scope.hasProductAccess &&
      !scope.hasSkuAccess &&
      !scope.hasBatchAccess &&
      !scope.hasWarehouseAccess &&
      !scope.hasLocationAccess
    ) {
      const allowedBatchIds = await getBatchIdsBySourceIds(packingMaterialIds);
      
      if (batchIds.some((id) => !allowedBatchIds.includes(id))) {
        throw AppError.authorizationError('Some batches are outside your packing material access.');
      }
    }
    
    const result = await getInventoryActivityLogs({ filters, page, limit, sortBy, sortOrder });
    return transformInventoryActivityLogs(result);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to retrieve inventory activity log report.', {
      meta: { error: error.message, context },
    });
  }
};

module.exports = {
  fetchInventoryActivityLogsService,
};
