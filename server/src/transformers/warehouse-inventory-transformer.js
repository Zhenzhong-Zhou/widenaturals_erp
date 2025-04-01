/**
 * Transforms a single warehouse inventory summary row.
 * @param {object} row - A single row from the DB result.
 * @returns {object} - Transformed inventory summary.
 */
const transformWarehouseInventorySummary = (row) => {
  return {
    warehouseInventoryId: row.warehouse_inventory_id,
    warehouse: {
      id: row.warehouse_id,
      name: row.warehouse_name,
      storageCapacity: Number(row.storage_capacity),
      location: row.location_name,
    },
    inventory: {
      id: row.inventory_id,
      itemType: row.item_type,
      itemName: row.item_name,
    },
    quantity: {
      reserved: Number(row.reserved_quantity),
      available: Number(row.available_quantity),
      totalLot: Number(row.total_lot_quantity),
      inStock: Number(row.in_stock_quantity),
    },
    fees: {
      warehouseFee: Number(row.warehouse_fee),
    },
    dates: {
      lastUpdate: row.last_update ? new Date(row.last_update) : null,
      earliestManufactureDate: row.earliest_manufacture_date
        ? new Date(row.earliest_manufacture_date)
        : null,
      nearestExpiryDate: row.nearest_expiry_date
        ? new Date(row.nearest_expiry_date)
        : null,
      displayStatusDate: row.display_status_date
        ? new Date(row.display_status_date)
        : null,
    },
    status: {
      display: row.display_status,
    },
    audit: {
      createdAt: row.created_at ? new Date(row.created_at) : null,
      updatedAt: row.updated_at ? new Date(row.updated_at) : null,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
    },
  };
};

/**
 * Transforms an array of warehouse inventory rows.
 * @param {Array<object>} rows
 * @returns {Array<object>}
 */
const transformWarehouseInventorySummaryList = (rows = []) => {
  return rows.map(transformWarehouseInventorySummary);
};

/**
 * Transforms full paginated warehouse inventory summary response.
 *
 * @param {object} paginatedResult - Includes pagination and data fields
 * @returns {object} - Transformed paginated result
 */
const transformPaginatedWarehouseInventorySummary = (paginatedResult = {}) => {
  const {
    pagination: {
      page = 1,
      limit = 20,
      totalRecords = 0,
      totalPages = 0,
    } = {},
    data = [],
  } = paginatedResult;
  
  return {
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalRecords: Number(totalRecords),
      totalPages: Number(totalPages),
    },
    data: transformWarehouseInventorySummaryList(data),
  };
};

module.exports = {
  transformWarehouseInventorySummary,
  transformWarehouseInventorySummaryList,
  transformPaginatedWarehouseInventorySummary,
};
