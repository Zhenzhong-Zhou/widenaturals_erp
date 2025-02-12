const express = require('express');
const { adjustWarehouseInventoryLotsController } = require('../controllers/warehouse-inventory-lot-controller');


const router = express.Router();

// Batch inventory adjustments
router.patch('/adjust/bulk', adjustWarehouseInventoryLotsController);

// Route to adjust inventory (handles single and multiple records)
router.patch('/adjust/:id', adjustWarehouseInventoryLotsController);

module.exports = router;
