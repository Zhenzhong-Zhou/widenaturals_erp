const { fetchAllWarehouseInventories } = require('../services/warehouse-inventory-service');

/**
 * Controller to fetch all warehouse inventories with pagination, sorting, and filtering.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
const getAllWarehouseInventoriesController = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy, sortOrder } = req.query;
    
    const { inventories, pagination } = await fetchAllWarehouseInventories({
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder,
    });
    
    res.status(200).json({
      success: true,
      message: 'Warehouse inventories retrieved successfully',
      inventories,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch warehouse inventory for a specific warehouse.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 */
const getWarehouseInventoryByWarehouse = async (req, res, next) => {
  try {
    const { warehouseId } = req.params;
    const { page = 1, limit = 10, sortBy, sortOrder } = req.query;
    
    // const inventories = await warehouseInventoryService.fetchWarehouseInventoryByWarehouse(
    //   warehouseId,
    //   { page: Number(page), limit: Number(limit), sortBy, sortOrder }
    // );
    //
    // res.status(200).json({
    //   success: true,
    //   message: `Inventories for warehouse ${warehouseId} retrieved successfully`,
    //   data: inventories.data,
    //   pagination: inventories.pagination,
    // });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllWarehouseInventoriesController,
  getWarehouseInventoryByWarehouse,
};
