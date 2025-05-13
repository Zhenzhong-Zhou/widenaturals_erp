const {
  getWarehouseInventories,
  getWarehouseItemSummary,
  getWarehouseInventoryDetailsByWarehouseId, getPaginatedSkuInventorySummary,
} = require('../repositories/warehouse-inventory-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');
const {
  transformPaginatedWarehouseInventorySummary,
  transformPaginatedWarehouseItemSummary,
  transformWarehouseInventoryLotDetailList, transformPaginatedSkuInventorySummary,
} = require('../transformers/warehouse-inventory-transformer');
const { canViewWarehouseInventorySummary } = require('../business/warehouse-inventory-business');
const { getStatusId } = require('../config/status-cache');
const { logSystemError } = require('../utils/system-logger');

/**
 * Fetches a paginated SKU-level inventory summary for authorized users.
 *
 * This function validates the user's permission and pagination input,
 * delegates the DB call to the warehouse inventory repository,
 * and returns a transformed summary result with pagination metadata.
 *
 * @param {object} options
 * @param {number} [options.page=1] - Page number for pagination.
 * @param {number} [options.limit=20] - Number of records per page.
 * @param {object} options.user - The authenticated user object.
 * @returns {Promise<object>} - Transformed paginated inventory summary grouped by SKU.
 */
const fetchPaginatedSkuInventorySummary = async ({
                                                   page = 1,
                                                   limit = 20,
                                                   user,
                                                 }) => {
  if (!user) {
    throw AppError.authenticationError('User is not authenticated.');
  }
  
  const statusId = getStatusId('sku_active');
  
  const isAllowed = await canViewWarehouseInventorySummary(user);
  if (!isAllowed) {
    throw AppError.authorizationError(
      'You do not have permission to view SKU inventory summary.'
    );
  }
  
  if (page < 1 || limit < 1) {
    throw AppError.validationError('Invalid pagination parameters.');
  }
  
  try {
    const rawResult = await getPaginatedSkuInventorySummary({ page, limit, statusId });
    return transformPaginatedSkuInventorySummary(rawResult);
  } catch (error) {
    logSystemError('Failed to fetch paginated SKU inventory summary', {
      context: 'warehouse-inventory-service',
      params: { page, limit, userId: user.id },
      error,
    });
    
    throw AppError.serviceError('Unable to fetch SKU inventory summary at this time.');
  }
};

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
const fetchWarehouseItemSummary = async (warehouseId, page = 1, limit = 10) => {
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
    const inventoryDetails = transformWarehouseInventoryLotDetailList(data);

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
  fetchPaginatedSkuInventorySummary,
  fetchAllWarehouseInventories,
  fetchWarehouseItemSummary,
  fetchWarehouseInventoryDetailsByWarehouseId,
};
