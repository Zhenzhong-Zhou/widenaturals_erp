const express = require('express');
const {
  getProductsController,
  getProductDetailsByIdController,
  getProductsDropdownListController,
} = require('../controllers/product-controller');
const validate = require('../middlewares/validate');
const { paginationSchema } = require('../validators/product-validators');

const router = express.Router();

// Define the route for getting products
router.get('/', validate(paginationSchema), getProductsController);

// Route for fetching product details by ID
router.get('/product-details/:id', getProductDetailsByIdController);

router.get('/dropdown', getProductsDropdownListController);

module.exports = router;
