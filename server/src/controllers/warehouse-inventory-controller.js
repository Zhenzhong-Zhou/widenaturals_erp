const wrapAsync = require('../utils/wrap-async');
const {
  fetchPaginatedWarehouseInventoryItemSummary,
  fetchWarehouseInventorySummaryByItemIdService,
  fetchPaginatedWarehouseInventoryRecordService,
} = require('../services/warehouse-inventory-service');
const { logInfo } = require('../utils/logger-helper');
const AppError = require('../utils/AppError');
const {
  normalizePaginationAndSortParams,
  sanitizeCommonInventoryFilters,
} = require('../utils/query/inventory-query-utils');
const {
  createInventoryRecordService,
  adjustInventoryQuantitiesService,
} = require('../services/inventory-service');

/**
 * Controller: Handles GET request to fetch paginated warehouse inventory summary.
 *
 * This controller:
 * - Extracts pagination query parameters (`page`, `limit`, `itemType`) and the authenticated user
 * - Calls the service layer to fetch product or material inventory summary from warehouse inventory
 * - Logs the access for audit traceability
 * - Returns structured JSON response with inventory data and pagination info
 *
 * @route GET /api/v1/warehouse-inventory/summary
 * @access Protected
 *
 * @param {object} req - Express request object, with `query.page`, `query.limit`, `query.itemType`, and `user`
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {void}
 */
const getPaginatedWarehouseInventorySummaryController = wrapAsync(
  async (req, res) => {
    const { page, limit, itemType } = req.query;
    const user = req.user;

    const { data, pagination } =
      await fetchPaginatedWarehouseInventoryItemSummary({
        page,
        limit,
        itemType,
        user,
      });

    logInfo('Paginated warehouse inventory summary fetched', req, {
      context: 'warehouse-inventory-controller',
      userId: user.id,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      message: 'Warehouse inventory summary fetched successfully.',
      data,
      pagination,
    });
  }
);

/**
 * Controller to handle GET /warehouse-inventory/summary/:itemId/details
 * Returns paginated warehouse inventory summary for a given item ID (SKU or packaging material).
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 */
const getWarehouseInventorySummaryDetailsController = wrapAsync(
  async (req, res, next) => {
    const { itemId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (!itemId) {
      return next(
        AppError.validationError('Missing required parameter: itemId')
      );
    }

    const { data, pagination } =
      await fetchWarehouseInventorySummaryByItemIdService({
        page,
        limit,
        itemId,
      });

    return res.status(200).json({
      success: true,
      message:
        'Successfully fetched warehouse inventory summary details by item ID',
      data,
      pagination,
    });
  }
);

/**
 * Controller: GET /warehouse-inventory
 *
 * Handles the request to fetch paginated warehouse inventory records.
 * Parses query parameters (filters, pagination, sorting), calls the service,
 * and returns a formatted JSON response to the client.
 *
 * @route GET /warehouse-inventory
 * @group Warehouse Inventory
 *
 * @queryparam {number} [page=1] - Page number for pagination (1-based index)
 * @queryparam {number} [limit=20] - Number of records per page
 * @queryparam {string} [sortBy] - Field to sort by (e.g. 'productName', 'warehouseName')
 * @queryparam {string} [sortOrder=ASC] - Sort order direction ('ASC' or 'DESC')
 *
 * @queryparam {string} [batchType] - Filter by batch type ('product' | 'packaging_material')
 * @queryparam {string} [warehouseName] - Filter by warehouse name (ILIKE match)
 * @queryparam {string} [productName] - Filter by product name (ILIKE match)
 * @queryparam {string} [sku] - Filter by SKU code (ILIKE match)
 * @queryparam {string} [materialName] - Filter by packaging material name (ILIKE match)
 * @queryparam {string} [materialCode] - Filter by material code (ILIKE match)
 * @queryparam {string} [partName] - Filter by part name (ILIKE match)
 * @queryparam {string} [partCode] - Filter by part code (ILIKE match)
 * @queryparam {string} [partType] - Filter by part type (ILIKE match)
 * @queryparam {string} [lotNumber] - Filter by lot number (product or material)
 * @queryparam {string} [status] - Filter by inventory status name
 * @queryparam {string} [createdAt] - Filter by creation date (YYYY-MM-DD)
 *
 * @returns {200} Paginated warehouse inventory data including metadata and counts
 */
const getWarehouseInventoryRecordController = wrapAsync(async (req, res) => {
  // Normalize req.query to a plain object to avoid [Object: null prototype] issues
  const query = { ...req.query };

  // Extract pagination and sort clause
  const { page, limit, safeSortClause } = normalizePaginationAndSortParams(
    {
      page: query.page,
      limit: query.limit,
      sortByRaw: query.sortBy,
      sortOrderRaw: query.sortOrder,
    },
    'warehouseInventorySortMap'
  );

  // Sanitize filters based on warehouse context
  const filters = sanitizeCommonInventoryFilters(query, { type: 'warehouse' });

  // Fetch data using the service
  const { data, pagination } =
    await fetchPaginatedWarehouseInventoryRecordService({
      page,
      limit,
      filters,
      safeSortClause,
    });

  // Return successful response
  res.status(200).json({
    success: true,
    message: 'Successfully fetched warehouse inventory records',
    data,
    pagination,
  });
});

/**
 * Controller to handle the creation of inventory records for both warehouse and location.
 *
 * - Accepts a bulk array of records (max 20).
 * - Validates batch references before insertion.
 * - Inserts records into warehouse and location inventory tables.
 * - Logs inventory activity for traceability.
 * - Returns enriched inserted records.
 */
const createWarehouseInventoryRecordController = wrapAsync(
  async (req, res, next) => {
    const records = req.body?.records;

    if (!records || !Array.isArray(records)) {
      return next(
        AppError.validationError(
          'Request body must include a valid "records" array.'
        )
      );
    }

    const user_id = req.user?.id;
    if (!user_id) {
      return next(AppError.validationError('Missing authenticated user.'));
    }

    logInfo('Creating inventory records', req, {
      context:
        'warehouse-inventory-controller/createWarehouseInventoryRecordController',
      recordCount: records.length,
      requestedBy: user_id,
      requestId: req.id,
      traceId: req.traceId,
    });

    const result = await createInventoryRecordService(records, user_id);

    res.status(201).json({
      success: true,
      message:
        'Successfully created warehouse and/or location inventory records',
      data: result,
    });
  }
);

/**
 * Controller for adjusting warehouse and/or location inventory quantities.
 *
 * Expects a JSON body containing an array of update records.
 * Each record must include:
 *  - batch_type: 'product' | 'packaging_material'
 *  - batch_id: string
 *  - quantity: number
 *  - warehouse_id or location_id: string
 *  - inventory_action_type_id: string
 *  - adjustment_type_id: string (optional)
 *  - comments: string (optional)
 *  - meta: object (optional)
 *
 * Performs:
 *  - Validation of batch registry entries
 *  - Deduplication of updates by composite keys
 *  - Status determination (in_stock / out_of_stock)
 *  - Inventory updates and audit logging
 */
const adjustInventoryQuantitiesController = wrapAsync(
  async (req, res, next) => {
    const updates = req.body?.updates;
    const lock = req.body?.lock !== false; // defaults to true if undefined
    const user_id = req.user?.id;

    if (!Array.isArray(updates) || updates.length === 0 || !user_id) {
      return next(AppError.validationError('Missing or invalid input data.'));
    }

    const result = await adjustInventoryQuantitiesService(
      updates,
      user_id,
      lock
    );

    logInfo('Inventory adjustment completed successfully.', req, {
      context:
        'warehouse-inventory-controller/adjustInventoryQuantitiesController',
      user_id,
      lock,
      updated_record_count: updates.length,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: 'Inventory quantities adjusted successfully.',
      data: result,
    });
  }
);

module.exports = {
  getPaginatedWarehouseInventorySummaryController,
  getWarehouseInventorySummaryDetailsController,
  getWarehouseInventoryRecordController,
  createWarehouseInventoryRecordController,
  adjustInventoryQuantitiesController,
};
