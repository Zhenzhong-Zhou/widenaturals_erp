const express = require('express');
const { getAllWarehousesController, getWarehouseInventorySummaryController } = require('../controllers/warehouse-controller');

const router = express.Router();

// GET /api/warehouses - Fetch all warehouses with pagination
router.get('/', getAllWarehousesController);

/**
 * @route GET /api/warehouses/inventory-overview
 * @desc Get warehouse inventory summary with optional pagination & filtering
 * @access Private
 */
router.get('/inventory-overview', getWarehouseInventorySummaryController);

module.exports = router;
