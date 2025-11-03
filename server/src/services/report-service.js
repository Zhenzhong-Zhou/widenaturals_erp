const {
  getUserInventoryAccessScope,
  rejectEmptyFiltersForScopedAccess,
} = require('../business/reports/inventory-activity-report-business');
const {
  getInventoryActivityLogs,
  getLatestFilteredInventoryActivityLogs,
  getSkuIdsByProductIds,
  getBatchIdsBySourceIds,
} = require('../repositories/reports/inventory-activity-report');
const {
  transformInventoryActivityLogs,
  transformFlatInventoryActivityLogs,
} = require('../transformers/reports/inventory-activity-report-transformer');
const { logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');
const { enforceAllowedFilters } = require('../utils/inventory-log-utils');
const {
  PERMISSION_FILTERS_MAP,
} = require('../utils/inventory-permission-mapping');

/**
 * Determines the permission key based on the user's inventory access scope.
 *
 * The returned key corresponds to the user's highest access level,
 * in order of priority from full access down to base-level access.
 *
 * @param {Object} scope - The user's access scope object.
 * @param {boolean} scope.hasFullAccess - Full system-wide access.
 * @param {boolean} scope.hasProductAccess - Access restricted to specific products.
 * @param {boolean} scope.hasSkuAccess - Access restricted to specific SKUs.
 * @param {boolean} scope.hasPackingMaterialAccess - Access to packing material data.
 * @param {boolean} scope.hasBatchAccess - Access restricted to inventory batches.
 * @param {boolean} scope.hasWarehouseAccess - Access to specific warehouses.
 * @param {boolean} scope.hasLocationAccess - Access to specific locations.
 * @returns {string} The permission key (e.g., 'full', 'product', 'sku', etc.)
 */
const determinePermissionKey = (scope) => {
  if (scope.hasFullAccess) return 'full';
  if (scope.hasProductAccess) return 'product';
  if (scope.hasSkuAccess) return 'sku';
  if (scope.hasPackingMaterialAccess) return 'packing_material';
  if (scope.hasBatchAccess) return 'batch';
  if (scope.hasWarehouseAccess) return 'warehouse';
  if (scope.hasLocationAccess) return 'location';
  return 'base';
};

/**
 * Service: Fetch and transform inventory activity logs for reporting.
 *
 * Core Responsibilities:
 * - Determine the user's inventory access scope (e.g., full, product, SKU, warehouse, etc.)
 * - Enforce filter-level permission validation based on scope
 * - Reject requests with missing or unauthorized filters for scoped users
 * - Support optimized handling for base-level access (limited filter and record constraints)
 * - Retrieve and transform log data from the repository based on valid filter input
 * - Support pagination and sorting for large log sets
 *
 * @param {Object} params - Parameters for the report.
 * @param {Object} params.filters - Filtering options (e.g., warehouseIds, skuIds, batchIds, date range).
 * @param {number} [params.page=1] - Page number for pagination.
 * @param {number} [params.limit=20] - Number of records per page.
 * @param {string} [params.sortBy='action_timestamp'] - Column to sort by (validated against sort map).
 * @param {string} [params.sortOrder='DESC'] - Sort order direction ('ASC' or 'DESC').
 * @param {Object} user - Authenticated user object.
 *
 * @returns {Promise<Object>} Resolves with transformed inventory activity logs and pagination metadata.
 *
 * @throws {AppError.AuthorizationError} If permission is denied or filters are invalid.
 * @throws {AppError.ServiceError} If the logs could not be retrieved due to internal issues.
 */
const fetchInventoryActivityLogsService = async (
  {
    filters = {},
    page = 1,
    limit = 20,
    sortBy = 'action_timestamp',
    sortOrder = 'DESC',
  } = {},
  user
) => {
  try {
    const scope = await getUserInventoryAccessScope(user);
    const permissionKey = determinePermissionKey(scope);
    const allowedKeys = PERMISSION_FILTERS_MAP[permissionKey];

    // Full access: allow everything
    if (allowedKeys.includes('*')) {
      const result = await getInventoryActivityLogs({
        filters,
        page,
        limit,
        sortBy,
        sortOrder,
      });
      return transformInventoryActivityLogs(result);
    }

    // Base access
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

    // Scoped access: enforce filters
    rejectEmptyFiltersForScopedAccess(scope, filters, allowedKeys);

    const {
      productIds = [],
      skuIds = [],
      batchIds = [],
      packingMaterialIds = [],
      warehouseIds = [],
      locationIds = [],
    } = filters;

    // Enforce warehouse/location dependency
    const dependentFilters =
      productIds.length +
        skuIds.length +
        batchIds.length +
        packingMaterialIds.length >
      0;

    if (
      scope.hasWarehouseAccess &&
      !scope.hasFullAccess &&
      dependentFilters &&
      warehouseIds.length === 0
    ) {
      throw AppError.authorizationError(
        'You must specify warehouseIds when using product, SKU, batch, or packing material filters.'
      );
    }

    if (
      scope.hasLocationAccess &&
      !scope.hasFullAccess &&
      dependentFilters &&
      locationIds.length === 0
    ) {
      throw AppError.authorizationError(
        'You must specify locationIds when using product, SKU, batch, or packing material filters.'
      );
    }

    // Product-scoped validation
    if (
      scope.hasProductAccess &&
      !scope.hasFullAccess &&
      !scope.hasSkuAccess &&
      !scope.hasBatchAccess &&
      !scope.hasWarehouseAccess &&
      !scope.hasLocationAccess &&
      !scope.hasPackingMaterialAccess
    ) {
      const allowedSkuIds = await getSkuIdsByProductIds(productIds);
      const allowedBatchIds = await getBatchIdsBySourceIds(productIds);

      if (
        skuIds.some((id) => !allowedSkuIds.includes(id)) ||
        batchIds.some((id) => !allowedBatchIds.includes(id))
      ) {
        throw AppError.authorizationError(
          'Some SKUs or batches are outside your product access.'
        );
      }
    }

    // Packing material-scoped validation
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
        throw AppError.authorizationError(
          'Some batches are outside your packing material access.'
        );
      }
    }

    const result = await getInventoryActivityLogs({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return transformInventoryActivityLogs(result);
  } catch (error) {
    if (error?.type === 'AuthorizationError') throw error;

    logSystemException(error, 'Failed to fetch inventory activity logs', {
      context: 'report-service/fetchInventoryActivityLogsService',
      userId: user?.id,
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
    });

    throw AppError.serviceError(
      'Unable to retrieve inventory activity log report.'
    );
  }
};

module.exports = {
  fetchInventoryActivityLogsService,
};
