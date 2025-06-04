const express = require('express');
const {
  allocateMultipleInventoryItemsController,
} = require('../controllers/inventory-allocation-controller');

const router = express.Router();

router.post('/allocate/:order_id', allocateMultipleInventoryItemsController);

module.exports = router;
