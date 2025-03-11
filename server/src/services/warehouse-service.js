const {
  getWarehouses,
  getWarehouseInventorySummary,
  getActiveWarehousesForDropdown,
  getWarehouseDetailsById,
} = require('../repositories/warehouse-repository');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

const fetchAllWarehouses = async ({ page, limit, sortBy, sortOrder }) => {
  try {
    logInfo('Fetching warehouses with pagination...');

    // **Ensure valid pagination input**
    page = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    limit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
    sortBy = sortBy || 'name';
    sortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    // **Retrieve warehouse data**
    const { data, pagination } = await getWarehouses({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    // **Apply business logic** (e.g., filtering warehouses with zero storage capacity)
    const filteredWarehouses = data.filter((wh) => wh.storage_capacity > 0);

    return {
      warehouses: filteredWarehouses,
      pagination,
    };
  } catch (error) {
    logError('Error fetching warehouses:', error);
    throw AppError.serviceError('Failed to retrieve warehouses');
  }
};

/**
 * Fetch warehouse details by ID with business logic.
 * @param {string} warehouseId - The UUID of the warehouse.
 * @returns {Promise<Object>} - Warehouse details including location, status, and metadata.
 * @throws {AppError} - Throws validation error if warehouseId is missing or invalid.
 */
const fetchWarehouseDetails = async (warehouseId) => {
  if (!warehouseId) {
    throw AppError.validationError('Warehouse ID is required.');
  }

  try {
    const warehouse = await getWarehouseDetailsById(warehouseId);

    if (!warehouse) {
      throw AppError.notFoundError(
        `Warehouse with ID ${warehouseId} not found.`
      );
    }

    // Business Logic: Check if the warehouse is active before returning details
    let errorMessages = [];
    if (warehouse.warehouse_status_name.toLowerCase() !== 'active') {
      errorMessages.push('Warehouse status is not active');
    }
    if (warehouse.location_status_name.toLowerCase() !== 'active') {
      errorMessages.push('Location status is not active');
    }

    if (errorMessages.length > 0) {
      throw AppError.validationError(
        `Warehouse ${warehouse.name} cannot be used: ${errorMessages.join(' & ')}.`
      );
    }

    // Business Logic: Transform certain fields if needed
    return {
      id: warehouse.warehouse_id,
      name: warehouse.warehouse_name,
      storageCapacity: warehouse.storage_capacity, // New field added
      status: {
        id: warehouse.warehouse_status_id,
        name: warehouse.warehouse_status_name,
      },
      metadata: {
        createdBy: warehouse.created_by,
        updatedBy: warehouse.updated_by,
        createdAt: warehouse.warehouse_created_at,
        updatedAt: warehouse.warehouse_updated_at,
      },
      location: {
        id: warehouse.location_id,
        name: warehouse.location_name,
        address: warehouse.location_address,
        locationType: {
          id: warehouse.location_type_id,
          name: warehouse.location_type_name,
          description: warehouse.location_type_description,
        },
        status: {
          id: warehouse.location_status_id,
          name: warehouse.location_status_name,
          statusDate: warehouse.location_status_date,
        },
        metadata: {
          createdBy: warehouse.location_created_by,
          updatedBy: warehouse.location_updated_by,
          createdAt: warehouse.location_created_at,
          updatedAt: warehouse.location_updated_at,
        },
      },
    };
  } catch (error) {
    console.error(error);
    logError('Error fetching warehouse details service:', error);
    throw AppError.serviceError('Failed to fetch warehouse details.');
  }
};

/**
 * Service to get warehouse inventory summary with business logic.
 *
 * @param {Object} options - Query parameters
 * @param {number} options.page - Pagination page number (optional)
 * @param {number} options.limit - Number of records per page (optional)
 * @param {string} options.statusFilter - Warehouse status filter ('active', 'inactive', 'all') (default: 'active')
 * @returns {Promise<Object>} Warehouse inventory summary response
 */
const fetchWarehouseInventorySummary = async ({
  page,
  limit,
  statusFilter = 'active',
}) => {
  try {
    // Validate status filter input
    const allowedStatuses = ['active', 'inactive', 'all'];
    if (!allowedStatuses.includes(statusFilter)) {
      throw AppError.validationError(
        `Invalid statusFilter: '${statusFilter}'. Allowed: ${allowedStatuses.join(', ')}`
      );
    }

    // Fetch warehouse inventory summary from repository
    const { data, pagination } = await getWarehouseInventorySummary({
      page,
      limit,
      statusFilter,
    });

    // Transform response (Adding computed fields and handling defaults)
    const formattedSummary = data.map((warehouse) => ({
      warehouseId: warehouse.warehouse_id,
      warehouseName: warehouse.warehouse_name,
      status: warehouse.status_name,
      totalProducts: warehouse.total_products || 0,
      totalLots: warehouse.total_lots || 0,
      totalQuantity: warehouse.total_quantity || 0,
      totalReservedStock: Math.min(
        warehouse.total_reserved_stock || 0,
        warehouse.total_quantity || 0
      ),
      totalAvailableStock: Math.max(
        (warehouse.total_quantity || 0) - (warehouse.total_reserved_stock || 0),
        0
      ),
      totalWarehouseFees: warehouse.total_warehouse_fees
        ? parseFloat(warehouse.total_warehouse_fees).toFixed(2)
        : '0.00',
      lastInventoryUpdate: warehouse.last_inventory_update
        ? warehouse.last_inventory_update
        : 'N/A',
      earliestExpiry: warehouse.earliest_expiry || 'N/A',
      latestExpiry: warehouse.latest_expiry || 'N/A',
      totalZeroStockLots: warehouse.total_zero_stock_lots || 0,
    }));

    return {
      formattedSummary,
      pagination,
    };
  } catch (error) {
    logError('Error in fetchWarehouseInventorySummary:', error);
    throw AppError.serviceError('Failed to retrieve warehouse inventory summary.');
  }
};

const fetchWarehouseDropdownList = async () => {
  try {
    return await getActiveWarehousesForDropdown();
  } catch (error) {
    throw AppError.serviceError(
      `Failed to fetch warehouse dropdown: ${error.message}`
    );
  }
};

module.exports = {
  fetchAllWarehouses,
  fetchWarehouseDetails,
  fetchWarehouseInventorySummary,
  fetchWarehouseDropdownList,
};
