const express = require('express');
const {
  getProductsDropdownListController,
  getProductsForDropdownController,
} = require('../controllers/product-controller');

const router = express.Router();

router.get(
  '/dropdown/warehouse/:warehouseId',
  getProductsDropdownListController
);

router.get('/dropdown/orders', getProductsForDropdownController);

module.exports = router;
