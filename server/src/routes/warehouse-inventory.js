const express = require('express');
const { getAllWarehouseInventoriesController, getWarehouseProductSummaryController } = require('../controllers/warehouse-inventory-controller');

const router = express.Router();

// GET /api/warehouse-inventory - Fetch all warehouse inventory with pagination
router.get('/', getAllWarehouseInventoriesController);

/**
 * @route GET /warehouse-inventories/:warehouseId/products-summary
 * @desc Get warehouse product summary with pagination
 * @access Private
 */
router.get('/:warehouseId/products-summary', getWarehouseProductSummaryController);

module.exports = router;
