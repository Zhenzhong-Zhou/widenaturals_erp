const express = require('express');
const {
  getAllWarehouseInventoriesController,
  getWarehouseItemSummaryController,
  getWarehouseInventoryDetailsController, getPaginatedSkuInventorySummaryController,
} = require('../controllers/warehouse-inventory-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

/**
 * @route GET /warehouse-inventory/sku-summary
 * @description Returns a paginated summary of SKU-level inventory grouped from warehouse_inventory.
 * @access Protected
 * @permission view_warehouse_inventory or equivalent
 */
router.get('/sku-summary', getPaginatedSkuInventorySummaryController);

// GET /api/warehouse-inventory - Fetch all warehouse inventories with pagination
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
