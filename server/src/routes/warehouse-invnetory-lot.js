const express = require('express');
const { adjustWarehouseInventoryLotsController } = require('../controllers/warehouse-inventory-lot-controller');


const router = express.Router();

// Route to adjust inventory (handles single and multiple records)
router.patch('/adjust/:id', adjustWarehouseInventoryLotsController);

// Batch inventory adjustments
router.patch('/adjust', adjustWarehouseInventoryLotsController);

module.exports = router;
