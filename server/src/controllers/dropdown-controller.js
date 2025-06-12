const wrapAsync = require('../utils/wrap-async');
const {
  fetchBatchRegistryDropdownService,
  fetchWarehouseDropdownService, fetchLotAdjustmentDropdownService,
} = require('../services/dropdown-service');
const { logInfo } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Controller to handle dropdown fetch requests for batch registry.
 * Supports query params for filtering, pagination, and inventory exclusion scoped to warehouse or location.
 *
 * @route GET /api/batch-registry/dropdown
 * @query {string} [batchType] - 'product' or 'packaging_material'
 * @query {string} [warehouseId] - Optional warehouse ID to exclude batches already present in that warehouse
 * @query {string} [locationId] - Optional location ID to exclude batches already present in that location
 * @query {number} [limit=50] - Pagination limit
 * @query {number} [offset=0] - Pagination offset
 */
const getBatchRegistryDropdownController = wrapAsync(async (req, res, next) => {
  logInfo('Incoming request for batch registry dropdown', req, {
    context: 'dropdown-controller/getBatchRegistryDropdown',
    metadata: {
      query: req.query,
      user: req.user?.id,
      ip: req.ip,
    },
  });

  const query = { ...req.query };

  const { batchType, warehouseId, locationId, limit = 50, offset = 0 } = query;

  const numericLimit = Number(limit);
  const numericOffset = Number(offset);

  if (!Number.isInteger(numericOffset) || numericOffset < 0) {
    return next(
      AppError.validationError('Offset must be a non-negative integer.')
    );
  }

  if (
    !Number.isInteger(numericLimit) ||
    numericLimit <= 0 ||
    numericLimit > 100
  ) {
    return next(
      AppError.validationError(
        'Limit must be a positive integer no greater than 100.'
      )
    );
  }

  const filters = {};
  if (batchType) filters.batchType = batchType;
  if (warehouseId) filters.warehouseId = warehouseId;
  if (locationId) filters.locationId = locationId;

  const dropdownResult = await fetchBatchRegistryDropdownService({
    filters,
    limit: numericLimit,
    offset: numericOffset,
  });

  const { items, hasMore } = dropdownResult;

  res.status(200).json({
    success: true,
    message: `Successfully retrieved batch registry dropdown`,
    items,
    limit: numericLimit,
    offset: numericOffset,
    hasMore,
  });
});

/**
 * Controller to fetch a filtered warehouse dropdown list.
 * Accepts optional query parameters: locationTypeId, warehouseTypeId, includeArchived.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>}
 */
const getWarehouseDropdownController = wrapAsync(async (req, res) => {
  const filters = {
    locationTypeId: req.query.locationTypeId || undefined,
    warehouseTypeId: req.query.warehouseTypeId || undefined,
    includeArchived: req.query.includeArchived === 'true',
  };

  const dropdownItems = await fetchWarehouseDropdownService(filters);

  res.status(200).json({
    success: true,
    message: `Successfully retrieved warehouses dropdown`,
    data: dropdownItems,
  });
});

/**
 * @function getLotAdjustmentDropdownController
 * @description Express controller to return lot adjustment dropdown options.
 * Accepts optional query param `excludeInternal=true` to filter internal-only actions.
 *
 * @route GET /adjustments/dropdown
 * @returns {200} Array of lot adjustment options with id, label, and action type.
 */
const getLotAdjustmentDropdownController = wrapAsync(async (req, res) => {
  const excludeInternal = req.query.excludeInternal === 'true';
  
  const options = await fetchLotAdjustmentDropdownService({ excludeInternal });
  
  res.status(200).json({
    success: true,
    message: `Successfully retrieved lot adjustment dropdown`,
    data: options,
  });
});

module.exports = {
  getBatchRegistryDropdownController,
  getWarehouseDropdownController,
  getLotAdjustmentDropdownController,
};
