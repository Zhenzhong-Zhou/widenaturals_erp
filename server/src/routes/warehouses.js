const express = require('express');
const { getAllWarehousesController, getWarehouseInventorySummaryController } = require('../controllers/warehouse-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

// GET /api/warehouses - Fetch all warehouses with pagination
router.get('/', authorize(['view_warehouses', 'manage_warehouses']), getAllWarehousesController);

/**
 * @route GET /api/warehouses/inventory-overview
 * @desc Get warehouse inventory summary with optional pagination & filtering
 * @access Private
 */
router.get('/inventory-overview', authorize(['view_warehouses', 'manage_warehouses']), getWarehouseInventorySummaryController);

module.exports = router;
