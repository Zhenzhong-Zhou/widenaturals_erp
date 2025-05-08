const express = require('express');
const {
  getProductsController,
  getProductDetailsByIdController,
  getProductsDropdownListController,
  getProductsForDropdownController,
} = require('../controllers/product-controller');
const validate = require('../middlewares/validate');
const { paginationSchema } = require('../validators/product-validators');

const router = express.Router();

// Route for fetching product details by ID
router.get('/product-details/:id', getProductDetailsByIdController);

router.get(
  '/dropdown/warehouse/:warehouseId',
  getProductsDropdownListController
);

router.get('/dropdown/orders', getProductsForDropdownController);

module.exports = router;
