const express = require('express');
const { getProductsController } = require('../controllers/product-controller');
const validate = require('../middlewares/validate');
const { paginationSchema } = require('../validators/product-validators');

const router = express.Router();

// Define the route for getting products
router.get('/', validate(paginationSchema), getProductsController);

module.exports = router;
