const express = require('express');
const { getProductsController } = require('../controllers/product-controoler');

const router = express.Router();

// Define the route for getting products
router.get('/', getProductsController);

module.exports = router;
