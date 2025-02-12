const { getWarehouseInventories, getWarehouseProductSummary, getWarehouseInventoryDetailsByWarehouseId } = require('../repositories/warehouse-inventory-repository');
const AppError = require('../utils/AppError');
const { logError } = require('../utils/logger-helper');

/**
 * Fetch paginated warehouse inventories with sorting.
 * @param {Object} params - Query parameters.
 * @param {number} params.page - Current page number.
 * @param {number} params.limit - Number of records per page.
 * @param {string} params.sortBy - Column to sort by.
 * @param {string} params.sortOrder - Sorting order (ASC or DESC).
 * @returns {Promise<Object>} - Paginated warehouse inventory records.
 */
const fetchAllWarehouseInventories = async ({ page, limit, sortBy, sortOrder }) => {
  if (page < 1 || limit < 1) {
    throw new AppError('Invalid pagination parameters', 400);
  }
  
  // Fetch inventories
  const  { data, pagination }  = await getWarehouseInventories({ page, limit, sortBy, sortOrder });
  
  // Business logic: Post-processing (if needed)
  const inventories = data.map((inventory) => ({
    ...inventory,
    warehouse_fee: inventory.warehouse_fee
      ? `${parseFloat(inventory.warehouse_fee).toFixed(2)}`
      : 'N/A',
    reserved_quantity: inventory.reserved_quantity || 0,
  }));
  
  return { inventories, pagination };
};

/**
 * Validate warehouse existence before fetching inventories.
 * @param {string} warehouseId - Warehouse ID.
 * @param {Object} params - Query parameters.
 * @returns {Promise<Object>} - Warehouse inventories if valid warehouse exists.
 */
const fetchWarehouseInventoryByWarehouse = async (warehouseId, params) => {
  if (!warehouseId) {
    throw new AppError('Warehouse ID is required', 400);
  }
  
  // const warehouse = await warehouseRepository.getWarehouseById(warehouseId);
  // if (!warehouse) {
  //   throw new AppError(`Warehouse with ID ${warehouseId} not found`, 404);
  // }
  
  return fetchAllWarehouseInventories(params);
};

/**
 * Service function to fetch warehouse product summary.
 *
 * @param {string} warehouseId - The ID of the warehouse.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of records per page.
 * @returns {Promise<Object>} - Returns formatted warehouse product summary data.
 */
const fetchWarehouseProductSummary = async (warehouseId, page = 1, limit = 10) => {
  try {
    // Validate input parameters
    if (!warehouseId) {
      throw new AppError('Warehouse ID is required.', 400);
    }
    if (page < 1 || limit < 1) {
      throw new AppError('Invalid pagination parameters. Page and limit must be positive numbers.', 400);
    }
    
    // Call the repository function to get warehouse product summary
    const { data, pagination } = await getWarehouseProductSummary({ warehouse_id: warehouseId, page, limit });
    
    if (!data || data.length === 0) {
      return {
        success: true,
        message: 'No products found for the specified warehouse.',
        data: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }
    
    const productSummaryData = data.map(product => ({
      productId: product.product_id,
      productName: product.product_name,
      totalLots: product.total_lots,
      totalReservedStock: product.total_reserved_stock,
      totalAvailableStock: product.total_available_stock,
      totalZeroStockLots: product.total_zero_stock_lots,
      earliestExpiry: product.earliest_expiry,
      latestExpiry: product.latest_expiry,
    }));
    
    // Format the response for the API
    return {
      productSummaryData,
      pagination,
    };
  } catch (error) {
    logError(`Error fetching warehouse product summary (warehouseId: ${warehouseId}, page: ${page}, limit: ${limit}):`, error);
    throw new AppError(error.message || 'Failed to fetch warehouse product summary.', error.statusCode || 500);
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
const fetchWarehouseInventoryDetailsByWarehouseId = async (warehouse_id, page = 1, limit = 10) => {
  try {
    if (!warehouse_id) {
      throw new AppError('Warehouse ID is required.', 400);
    }
    
    // Fetch paginated inventory details from the repository
    const { data, pagination } = await getWarehouseInventoryDetailsByWarehouseId({
      warehouse_id,
      page,
      limit,
    });
    
    // Transform the data if needed (e.g., formatting dates, structuring response)
    const inventoryDetails = data.map(item => ({
      warehouseInventoryId: item.warehouse_inventory_id,
      productId: item.product_id,
      productName: item.product_name,
      warehouseInventoryLotId: item.warehouse_inventory_lot_id,
      lotNumber: item.lot_number,
      lotQuantity: item.lot_quantity,
      reservedStock: item.reserved_stock,
      warehouseFees: item.warehouse_fees,
      lotStatus: item.lot_status || 'Unknown',
      manufactureDate: item.manufacture_date,
      expiryDate: item.expiry_date,
      inboundDate: item.inbound_date,
      outboundDate: item.outbound_date,
      lastUpdate: item.last_update,
      
      inventoryCreated: {
        date: item.inventory_created_at,
        by: item.inventory_created_by,
      },
      inventoryUpdated: {
        date: item.inventory_updated_at,
        by: item.inventory_updated_by,
      },
      lotCreated: {
        date: item.lot_created_at,
        by: item.lot_created_by,
      },
      lotUpdated: {
        date: item.lot_updated_at,
        by: item.lot_updated_by,
      }
    }));
    
    return {
      inventoryDetails,
      pagination,
    };
  } catch (error) {
    throw new AppError(error.message || 'Failed to retrieve warehouse inventory details.', error.statusCode || 500);
  }
};

module.exports = {
  fetchAllWarehouseInventories,
  fetchWarehouseProductSummary,
  fetchWarehouseInventoryDetailsByWarehouseId,
};
