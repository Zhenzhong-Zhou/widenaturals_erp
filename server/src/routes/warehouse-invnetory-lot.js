const express = require('express');
const {
  adjustWarehouseInventoryLotsController,
  insertInventoryRecordResponseController, getAvailableInventoryLotsController,
} = require('../controllers/warehouse-inventory-lot-controller');

const router = express.Router();

// Batch inventory adjustments
router.patch('/adjust/bulk', adjustWarehouseInventoryLotsController);

// Route to adjust inventory (handles single and multiple records)
router.patch('/adjust/:id', adjustWarehouseInventoryLotsController);

router.post(
  '/inventory-records/recent-inserts',
  insertInventoryRecordResponseController
);

router.get('/inventory/:inventoryId/lots', getAvailableInventoryLotsController);

module.exports = router;
