const {
  fetchLocationInventoryKpiSummaryService,
  fetchLocationInventorySummaryService,
  fetchLocationInventorySummaryByItemIdService,
  createInventoryRecords,
} = require('../services/location-inventory-service');
const wrapAsync = require('../utils/wrap-async');
const { logError, logInfo } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');

/**
 * Controller to handle fetching KPI summary metrics for location inventory.
 *
 * @route GET /api/location-inventory/kpi-summary
 * @queryParam {string} [itemType] - Optional item type filter ('product' | 'packaging_material')
 * @returns {200} JSON array of KPI summary objects grouped by item type, including a total row.
 */
const getLocationInventoryKpiSummaryController = wrapAsync(async (req, res) => {
  const { itemType } = req.query;
  
  if (itemType && !['product', 'packaging_material'].includes(itemType)) {
    return AppError.validationError('Invalid itemType. Must be "product" or "packaging_material".');
  }
  
  const summary = await fetchLocationInventoryKpiSummaryService({ itemType });
  
  return res.status(200).json({
    success: true,
    message: 'Successfully fetched KPI summary',
    data: summary
  });
});

/**
 * Controller to handle GET requests for location inventory summary.
 *
 * Parses query parameters for pagination, sorting, and filtering, then
 * delegates to the service layer to fetch summarized inventory data
 * (product or packaging material) from the `location_inventory` table.
 *
 * @route GET /api/inventory/summary
 * @queryparam {number} page - Current page number (default: 1)
 * @queryparam {number} limit - Records per page (default: 10)
 * @queryparam {string} sortBy - Sort key (e.g. 'sku', 'createdAt') (default: 'createdAt')
 * @queryparam {string} sortOrder - Sort direction ('ASC' or 'DESC') (default: 'DESC')
 * @queryparam {string} [product_name] - Filter by product name (ILIKE)
 * @queryparam {string} [material_name] - Filter by material name (ILIKE)
 * @queryparam {string} [lot_number] - Filter by lot number (ILIKE)
 * @queryparam {string} [sku] - Filter by SKU (ILIKE)
 * @queryparam {string} [status] - Filter by inventory status ID
 * @queryparam {string} [inbound_date] - Filter by inbound date (YYYY-MM-DD)
 * @queryparam {string} [expiry_date] - Filter by expiry date (YYYY-MM-DD)
 * @queryparam {string} [created_at] - Filter by created date (YYYY-MM-DD)
 * @queryparam {string} [location_id] - Filter by location
 *
 * @returns {200} JSON response containing summary records and pagination metadata
 */
const getLocationInventorySummaryController = wrapAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    ...rawFilters
  } = req.query;
  
  const filters = {
    batchType: rawFilters.batchType,
    productName: rawFilters.productName,
    sku: rawFilters.sku,
    materialName: rawFilters.materialName,
  };
  
  logInfo('Location inventory summary requested', req, {
    context: 'getLocationInventorySummaryController',
    userId: req.user?.id || 'anonymous',
    page,
    limit,
    sortBy,
    sortOrder,
    filters,
  });
  
  const { data, pagination } = await fetchLocationInventorySummaryService({
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    filters,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'Location inventory summary fetched successfully',
    data,
    pagination,
  });
});

/**
 * Controller to handle GET /location-inventory/summary/:itemId/details
 * Returns paginated location inventory summary for a given item ID (SKU or material).
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
const getLocationInventorySummaryDetailsController = wrapAsync(async (req, res, next) => {
  
  const { itemId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  if (!itemId) {
    return next(AppError.validationError('Missing required parameter: itemId'));
  }
  
  const { data, pagination } = await fetchLocationInventorySummaryByItemIdService({ page, limit, itemId });
  
  return res.status(200).json({
    success: true,
    message: 'Successfully fetched location inventory summary details by item ID',
    data,
    pagination,
  });
});

/**
 * Express route handler to reposition inventory (handles both single and bulk insert).
 */
const createInventoryRecordsController = wrapAsync(async (req, res, next) => {
  try {
    const { inventoryData } = req.body;

    const userId = req.user.id; // Extract from auth middleware

    const { success, message, data, warehouseLots } =
      await createInventoryRecords(inventoryData, userId);

    if (!success) {
      return res.status(400).json({ success, message, warehouseLots });
    }

    return res.status(201).json({ success: true, message, data });
  } catch (error) {
    logError('Controller error:', error.message);
    next(error);
  }
});

module.exports = {
  getLocationInventoryKpiSummaryController,
  getLocationInventorySummaryController,
  getLocationInventorySummaryDetailsController,
  createInventoryRecordsController,
};
