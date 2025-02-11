const express = require('express');
const { getAllWarehouseInventoriesController, getWarehouseProductSummaryController,
  getWarehouseInventoryDetailsController
} = require('../controllers/warehouse-inventory-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

// GET /api/warehouse-inventory - Fetch all warehouse inventory with pagination
// router.get('/', authorize(['view_warehouses', 'manage_warehouses']), getAllWarehouseInventoriesController);
router.get('/', getAllWarehouseInventoriesController);

/**
 * @route GET /warehouse-inventories/:warehouse_id/products-summary
 * @desc Get warehouse product summary with pagination
 * @access Private
 */
// router.get('/:warehouse_id/products-summary', authorize(['view_warehouses', 'manage_warehouses']), getWarehouseProductSummaryController);
router.get('/:warehouse_id/products-summary', getWarehouseProductSummaryController);

/**
 * @route GET /api/warehouse-inventory/:warehouse_id
 * @desc Get inventory details for a specific warehouse
 * @access Protected
 */
// router.get('/:warehouse_id', authorize(['view_warehouses', 'manage_warehouses']), getWarehouseInventoryDetailsController);
router.get('/:warehouse_id', getWarehouseInventoryDetailsController);

module.exports = router;
