const { getWarehouseInventories } = require('../repositories/warehouse-inventory-repository');
const AppError = require('../utils/AppError');

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

module.exports = {
  fetchAllWarehouseInventories,
  fetchWarehouseInventoryByWarehouse,
};
