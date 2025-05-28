const {
  getPaginatedWarehouseInventoryItemSummary,
  getWarehouseInventorySummaryDetailsByItemId,
  getPaginatedWarehouseInventoryRecords,
} = require('../repositories/warehouse-inventory-repository');
const AppError = require('../utils/AppError');
const {
  logSystemError,
  logSystemException,
  logSystemInfo
} = require('../utils/system-logger');
const {
  transformPaginatedWarehouseInventoryItemSummary,
  transformPaginatedWarehouseInventorySummaryDetails,
  transformPaginatedWarehouseInventoryRecordResults,
} = require('../transformers/warehouse-inventory-transformer');
const { canViewWarehouseInventorySummary } = require('../business/warehouse-inventory-business');
const { getStatusId } = require('../config/status-cache');
const { normalizePaginationAndSortParams } = require('../utils/query/inventory-query-utils');

/**
 * Fetches a paginated warehouse inventory item summary (products and/or materials).
 *
 * This function verifies the user's authorization, validates pagination input,
 * and fetches warehouse inventory summary data from the repository. It includes metadata
 * such as total records and pages, and supports unified or filtered summaries across products (SKUs)
 * and materials based on the `itemType` parameter.
 *
 * @param {object} options
 * @param {number} [options.page=1] - Page number for pagination.
 * @param {number} [options.limit=20] - Number of records per page.
 * @param {string} [options.itemType] - Optional filter for item type: 'product', 'material', or omitted for both.
 * @param {object} options.user - The authenticated user object.
 * @returns {Promise<object>} - Transformed paginated warehouse inventory summary with metadata.
 */
const fetchPaginatedWarehouseInventoryItemSummary = async ({
                                                             page = 1,
                                                             limit = 20,
                                                             itemType,
                                                             user,
                                                           }) => {
  const statusId = getStatusId('sku_active');
  
  const isAllowed = await canViewWarehouseInventorySummary(user);
  if (!isAllowed) {
    throw AppError.authorizationError(
      'You do not have permission to view warehouse inventory summary.'
    );
  }
  
  if (page < 1 || limit < 1) {
    throw AppError.validationError('Invalid pagination parameters.');
  }
  
  if (itemType && !['product', 'packaging_material'].includes(itemType)) {
    throw AppError.validationError(`Invalid itemType filter: ${itemType}`);
  }
  
  try {
    const rawResult = await getPaginatedWarehouseInventoryItemSummary({
      page,
      limit,
      itemType,
      statusId,
    });
    
    return transformPaginatedWarehouseInventoryItemSummary(rawResult);
  } catch (error) {
    logSystemError('Failed to fetch paginated warehouse inventory summary', {
      context: 'warehouse-inventory-service',
      params: { page, limit, itemType, userId: user.id },
      error,
    });
    
    throw AppError.serviceError('Unable to fetch warehouse inventory summary at this time.');
  }
};

/**
 * Service to fetch and transform paginated warehouse inventory summary details
 * for a given item ID (SKU or material).
 *
 * @param {Object} options - Request options.
 * @param {number} options.page - Current page number for pagination.
 * @param {number} options.limit - Number of records per page.
 * @param {string} options.itemId - SKU ID or packaging material ID.
 * @returns {Promise<Object>} Transformed and paginated warehouse inventory summary result.
 * @throws {AppError} On database or transformation failure.
 */
const fetchWarehouseInventorySummaryByItemIdService = async ({ page, limit, itemId }) => {
  try {
    const rawResult = await getWarehouseInventorySummaryDetailsByItemId({ page, limit, itemId });
    
    logSystemInfo('Successfully fetched warehouse inventory summary by item ID', {
      context: 'warehouse-inventory-service/fetchWarehouseInventorySummaryByItemId',
      itemId,
      page,
      limit,
      resultCount: rawResult?.data?.length ?? 0,
    });
    
    return transformPaginatedWarehouseInventorySummaryDetails(rawResult);
  } catch (error) {
    logSystemException(error, 'Failed to fetch and transform warehouse inventory summary', {
      context: 'warehouse-inventory-service/fetchWarehouseInventorySummaryByItemIdService',
      itemId,
      page,
      limit,
    });
    
    throw AppError.serviceError('Unable to retrieve warehouse inventory summary for the given item.');
  }
};

/**
 * Fetches and transforms paginated warehouse inventory records with optional filters and sorting.
 *
 * This service layer function:
 * - Sanitizes raw sort input to protect against SQL injection
 * - Applies fallback default sorting if no input is provided
 * - Delegates to the repository to fetch raw paginated results
 * - Transforms raw DB rows into structured display-ready objects
 *
 * @param {Object} options - Query options
 * @param {number} options.page - Current page number (1-based)
 * @param {number} options.limit - Number of records per page
 * @param {Object} [options.filters] - Optional filters (e.g., warehouseName, sku, productName, etc.)
 * @param {string} options.safeSortClause - Fully sanitized SQL ORDER BY clause
 *
 * @returns {Promise<Object>} Transformed paginated result, including structured inventory data and pagination metadata
 *    {
 *      data: Array<Object>,        // Transformed location inventory records
 *      pagination: {
 *        page: number,             // Current page
 *        limit: number,            // Items per page
 *        totalRecords: number,     // Total matching records
 *        totalPages: number        // Total number of pages
 *       }
 *     }
 */
const fetchPaginatedWarehouseInventoryRecordService = async ({
                                                               page,
                                                               limit,
                                                               filters,
                                                               safeSortClause,
                                                             }) => {
  try {
    const rawResult = await getPaginatedWarehouseInventoryRecords({
      page,
      limit,
      filters,
      safeSortClause,
    });
    
    return transformPaginatedWarehouseInventoryRecordResults(rawResult);
  } catch (error) {
    logSystemException(error, 'Failed in warehouseInventoryService.getPaginatedWarehouseInventory', {
      context: 'warehouse-inventory-service/getPaginatedWarehouseInventory',
      page,
      limit,
      filters,
    });
    
    throw AppError.serviceError('Failed to retrieve warehouse inventory data.');
  }
};

module.exports = {
  fetchPaginatedWarehouseInventoryItemSummary,
  fetchWarehouseInventorySummaryByItemIdService,
  fetchPaginatedWarehouseInventoryRecordService,
};
