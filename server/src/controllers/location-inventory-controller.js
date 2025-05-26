const {
  fetchLocationInventoryKpiSummaryService,
  fetchPaginatedLocationInventorySummaryService,
  fetchPaginatedLocationInventorySummaryByItemIdService,
  fetchPaginatedLocationInventoryRecordService,
} = require('../services/location-inventory-service');
const wrapAsync = require('../utils/wrap-async');
const AppError = require('../utils/AppError');
const { logInfo } = require('../utils/logger-helper');

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
  
  const { data, pagination } = await fetchPaginatedLocationInventorySummaryService({
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
 * Controller: GET /location-inventory/summary/:itemId/details
 *
 * Handles request to fetch paginated location inventory summary details
 * for a specific item ID (can be a SKU ID or a packaging material ID).
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 *
 * @returns {Promise<void>} Responds with paginated inventory summary in JSON format.
 */
const getLocationInventorySummaryDetailsController = wrapAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  if (!itemId) {
    return next(AppError.validationError('Missing required parameter: itemId'));
  }
  
  const { data, pagination } = await fetchPaginatedLocationInventorySummaryByItemIdService({ page, limit, itemId });
  
  return res.status(200).json({
    success: true,
    message: 'Successfully fetched location inventory summary details by item ID',
    data,
    pagination,
  });
});

/**
 * Controller: GET /location-inventory
 *
 * Handles incoming request to fetch paginated location inventory data.
 * Parses query parameters, calls the service, and returns a JSON response.
 *
 * @route GET /location-inventory
 * @group Location Inventory
 * @queryparam {number} [page=1] - Page number for pagination
 * @queryparam {number} [limit=20] - Number of items per page
 * @queryparam {string} [batchType] - Filter by batch type ('product' | 'packaging_material')
 * @queryparam {string} [locationName] - Filter by location name (ILIKE)
 * @queryparam {string} [productName] - Filter by product name (ILIKE)
 * @queryparam {string} [sku] - Filter by SKU (ILIKE)
 * @queryparam {string} [materialName] - Filter by material name (ILIKE)
 * @queryparam {string} [materialCode] - Filter by material code (ILIKE)
 * @queryparam {string} [partName] - Filter by part name (ILIKE)
 * @queryparam {string} [partCode] - Filter by part code (ILIKE)
 * @queryparam {string} [partType] - Filter by part type (ILIKE)
 * @queryparam {string} [lotNumber] - Filter by lot number (applies to both product/material lots)
 * @queryparam {string} [status] - Filter by inventory status name
 * @queryparam {string} [statusId] - Filter by inventory status ID
 * @queryparam {string} [inboundDate] - Filter by inbound date (YYYY-MM-DD)
 * @queryparam {string} [expiryDate] - Filter by expiry date (YYYY-MM-DD)
 * @queryparam {string} [createdAt] - Filter by creation date (YYYY-MM-DD)
 * @returns {200} 200 - Paginated inventory response
 */
const getLocationInventoryRecordController = wrapAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  
  let filters = {
    batchType: req.query.batchType || undefined,
    locationName: req.query.locationName || undefined,
    productName: req.query.productName || undefined,
    materialName: req.query.materialName || undefined,
    materialCode: req.query.materialCode || undefined,
    partName: req.query.partName || undefined,
    partCode: req.query.partCode || undefined,
    partType: req.query.partType || undefined,
    sku: req.query.sku || undefined,
    lotNumber: req.query.lotNumber || undefined,
    status: req.query.status || undefined,
    inboundDate: req.query.inboundDate || undefined, // format: yyyy-mm-dd
    expiryDate: req.query.expiryDate || undefined,   // format: yyyy-mm-dd
    createdAt: req.query.createdAt || undefined      // format: yyyy-mm-dd
  };

  // Sanitize filters based on batchType
  const isProduct = filters.batchType === 'product';
  const isMaterial = filters.batchType === 'packaging_material';
  
  if (isProduct) {
    // Remove material- and part-related filters
    delete filters.materialName;
    delete filters.materialCode;
    delete filters.partName;
    delete filters.partCode;
    delete filters.partType;
  } else if (isMaterial) {
    // Remove product-related filters
    delete filters.productName;
    delete filters.sku;
  }
  
  const { data, pagination } = await fetchPaginatedLocationInventoryRecordService({ page, limit, filters });
  
  res.status(200).json({
    success: true,
    message: 'Successfully fetched location inventory records',
    data,
    pagination,
  });
});

module.exports = {
  getLocationInventoryKpiSummaryController,
  getLocationInventorySummaryController,
  getLocationInventorySummaryDetailsController,
  getLocationInventoryRecordController,
};
