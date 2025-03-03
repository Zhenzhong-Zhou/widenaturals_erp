const express = require('express');
const {
  getAllWarehousesController,
  getWarehouseInventorySummaryController, getWarehouseDropdownListController, getWarehouseInfoController,
} = require('../controllers/warehouse-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

// GET /api/warehouses - Fetch all warehouses with pagination
router.get(
  '/',
  authorize(['view_warehouses', 'manage_warehouses']),
  getAllWarehousesController
);

router.get(
  '/details/:id',
  authorize(['view_warehouses', 'manage_warehouses']),
  getWarehouseInfoController
);

/**
 * @route GET /api/warehouses/inventory-overview
 * @desc Get warehouse inventory summary with optional pagination & filtering
 * @access Private
 */
// router.get('/inventory-overview', authorize(['view_warehouses', 'manage_warehouses']), getWarehouseInventorySummaryController);
router.get('/inventory-overview', getWarehouseInventorySummaryController);

router.get('/dropdown', getWarehouseDropdownListController);

module.exports = router;
