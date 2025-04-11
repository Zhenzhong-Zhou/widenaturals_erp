const express = require('express');
const {
  getAllWarehouseInventoriesController,
  getWarehouseItemSummaryController,
  getWarehouseInventoryDetailsController,
} = require('../controllers/warehouse-inventory-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

// GET /api/warehouse-inventory - Fetch all warehouse inventory with pagination
router.get(
  '/',
  authorize(['view_warehouses', 'manage_warehouses']),
  getAllWarehouseInventoriesController
);

/**
 * @route GET /warehouse-inventories/:warehouse_id/items-summary
 * @desc Get warehouse item summary with pagination
 * @access Private
 */
router.get(
  '/:warehouse_id/items-summary',
  authorize(['view_warehouses', 'manage_warehouses']),
  getWarehouseItemSummaryController
);

/**
 * @route GET /api/warehouse-inventory/:warehouse_id
 * @desc Get inventory details for a specific warehouse
 * @access Protected
 */
router.get(
  '/:warehouse_id',
  authorize(['view_warehouses', 'manage_warehouses']),
  getWarehouseInventoryDetailsController
);

module.exports = router;
