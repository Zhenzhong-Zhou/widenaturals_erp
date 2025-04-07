const {
  getWarehouseInventories,
  getWarehouseItemSummary,
  getWarehouseInventoryDetailsByWarehouseId,
} = require('../repositories/warehouse-inventory-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const { transformPaginatedWarehouseInventorySummary, transformPaginatedWarehouseItemSummary,
  transformWarehouseInventoryLotDetailList
} = require('../transformers/warehouse-inventory-transformer');

/**
 * Fetch paginated warehouse inventories with sorting.
 * @param {Object} params - Query parameters.
 * @param {number} params.page - Current page number.
 * @param {number} params.limit - Number of records per page.
 * @param {string} params.sortBy - Column to sort by.
 * @param {string} params.sortOrder - Sorting order (ASC or DESC).
 * @returns {Promise<Object>} - Paginated warehouse inventory records.
 */
const fetchAllWarehouseInventories = async ({
  page,
  limit,
  sortBy,
  sortOrder,
}) => {
  if (page < 1 || limit < 1) {
    throw AppError.validationError('Invalid pagination parameters');
  }

  // Fetch inventories using repository
  const result = await getWarehouseInventories({
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  return transformPaginatedWarehouseInventorySummary(result);
};

/**
 * Service function to fetch warehouse items summary.
 *
 * @param {string} warehouseId - The ID of the warehouse.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of records per page.
 * @returns {Promise<Object>} - Returns formatted warehouse items data.
 */
const fetchWarehouseItemSummary = async (
  warehouseId,
  page = 1,
  limit = 10
) => {
  try {
    // Validate input parameters
    if (!warehouseId) {
      throw AppError.validationError('Warehouse ID is required.');
    }
    if (page < 1 || limit < 1) {
      throw AppError.validationError(
        'Invalid pagination parameters. Page and limit must be positive numbers.'
      );
    }
    
    // Fetch raw data from repository
    const rawResult = await getWarehouseItemSummary({
      warehouse_id: warehouseId,
      page,
      limit,
    });
    
    // Handle empty results
    if (!rawResult.data || rawResult.data.length === 0) {
      return {
        success: true,
        message: 'No items found for the specified warehouse.',
        items: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }
    
    // Transform and return
    const { itemSummaryData, pagination } =
      transformPaginatedWarehouseItemSummary(rawResult);
    
    return {
      itemSummaryData,
      pagination,
    };
  } catch (error) {
    logError(
      `Error fetching warehouse items (warehouseId: ${warehouseId}, page: ${page}, limit: ${limit}):`,
      error
    );
    throw AppError.serviceError(
      error.message || 'Failed to fetch warehouse items.'
    );
  }
};

/**
 * Fetches warehouse inventory details by warehouse ID with pagination.
 *
 * @param {string} warehouse_id - The UUID of the warehouse.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of records per page.
 * @returns {Promise<object>} - Returns formatted warehouse inventory details with pagination.
 */
const fetchWarehouseInventoryDetailsByWarehouseId = async (
  warehouse_id,
  page = 1,
  limit = 10
) => {
  try {
    if (!warehouse_id) {
      throw AppError.validationError('Warehouse ID is required.');
    }
    
    // Fetch paginated inventory details from repository
    const { data, pagination } =
      await getWarehouseInventoryDetailsByWarehouseId({
        warehouse_id,
        page,
        limit,
      });
    
    // Transform the data (e.g., formatting dates, structuring response)
    const inventoryDetails = transformWarehouseInventoryLotDetailList(data)
    
    return {
      inventoryDetails,
      pagination,
    };
  } catch (error) {
    logError(
      `Error fetching warehouse inventory details (warehouseId: ${warehouse_id}, page: ${page}, limit: ${limit}):`,
      error
    );
    throw AppError.serviceError(
      error.message || 'Failed to retrieve warehouse inventory details.'
    );
  }
};

module.exports = {
  fetchAllWarehouseInventories,
  fetchWarehouseItemSummary,
  fetchWarehouseInventoryDetailsByWarehouseId,
};
