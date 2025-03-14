const {
  getWarehouseInventories,
  getWarehouseProductSummary,
  getWarehouseInventoryDetailsByWarehouseId,
} = require('../repositories/warehouse-inventory-repository');
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
  const { data, pagination } = await getWarehouseInventories({
    page,
    limit,
    sortBy,
    sortOrder,
  });

  // Business logic: Post-processing (if needed)
  const inventories = data.map((inventory) => ({
    warehouseInventoryId: inventory.warehouse_inventory_id,
    warehouseId: inventory.warehouse_id,
    warehouseName: inventory.warehouse_name,
    locationName: inventory.location_name,
    inventoryId: inventory.inventory_id,
    itemType: inventory.item_type,
    itemName: inventory.item_name,
    availableQuantity: inventory.available_quantity || 0,
    reservedQuantity: inventory.reserved_quantity || 0,
    warehouseFee: inventory.warehouse_fee
      ? `${parseFloat(inventory.warehouse_fee).toFixed(2)}`
      : 'N/A',
    lastUpdate: inventory.last_update,
    statusId: inventory.status_id,
    statusName: inventory.status_name,
    createdAt: inventory.created_at,
    updatedAt: inventory.updated_at,
    createdBy: inventory.created_by,
    updatedBy: inventory.updated_by,
  }));

  return { inventories, pagination };
};

/**
 * Service function to fetch warehouse product summary.
 *
 * @param {string} warehouseId - The ID of the warehouse.
 * @param {number} page - The page number for pagination.
 * @param {number} limit - The number of records per page.
 * @returns {Promise<Object>} - Returns formatted warehouse product summary data.
 */
const fetchWarehouseProductSummary = async (
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

    // Fetch warehouse product summary from repository
    const { data, pagination } = await getWarehouseProductSummary({
      warehouse_id: warehouseId,
      page,
      limit,
    });

    if (!data || data.length === 0) {
      return {
        success: true,
        message: 'No inventory items found for the specified warehouse.',
        data: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }

    const productSummaryData = data.map((product) => ({
      inventoryId: product.inventory_id,
      productName: product.product_name,
      totalLots: product.total_lots,
      totalReservedStock: product.total_reserved_stock,
      totalAvailableStock: product.total_available_stock,
      totalQtyStock: product.total_quantity_stock,
      totalZeroStockLots: product.total_zero_stock_lots,
      earliestExpiry: product.earliest_expiry,
      latestExpiry: product.latest_expiry,
    }));

    return {
      productSummaryData,
      pagination,
    };
  } catch (error) {
    logError(
      `Error fetching warehouse product summary (warehouseId: ${warehouseId}, page: ${page}, limit: ${limit}):`,
      error
    );
    throw AppError.validationError(
      error.message || 'Failed to fetch warehouse product summary.'
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
    const inventoryDetails = data.map((item) => ({
      warehouseInventoryId: item.warehouse_inventory_id,
      inventoryId: item.inventory_id,
      itemName: item.item_name,
      itemType: item.item_type,
      warehouseInventoryLotId: item.warehouse_inventory_lot_id,
      lotNumber: item.lot_number,
      lotQuantity: item.lot_quantity,
      reservedStock: item.reserved_stock,
      availableStock: item.available_stock,
      warehouseFees: item.warehouse_fees,
      lotStatus: item.lot_status || 'Unknown',
      manufactureDate: item.manufacture_date
        ? new Date(item.manufacture_date)
        : null,
      expiryDate: item.expiry_date ? new Date(item.expiry_date) : null,
      inboundDate: item.inbound_date ? new Date(item.inbound_date) : null,
      outboundDate: item.outbound_date ? new Date(item.outbound_date) : null,
      lastUpdate: item.last_update ? new Date(item.last_update) : null,

      inventoryCreated: {
        date: item.inventory_created_at
          ? new Date(item.inventory_created_at)
          : null,
        by: item.inventory_created_by,
      },
      inventoryUpdated: {
        date: item.inventory_updated_at
          ? new Date(item.inventory_updated_at)
          : null,
        by: item.inventory_updated_by,
      },
      lotCreated: {
        date: item.lot_created_at ? new Date(item.lot_created_at) : null,
        by: item.lot_created_by,
      },
      lotUpdated: {
        date: item.lot_updated_at ? new Date(item.lot_updated_at) : null,
        by: item.lot_updated_by,
      },
    }));

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
  fetchWarehouseProductSummary,
  fetchWarehouseInventoryDetailsByWarehouseId,
};
