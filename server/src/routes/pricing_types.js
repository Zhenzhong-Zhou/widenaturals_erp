/**
 * @file price_types.js
 * @description Routes related to user operations.
 */

const express = require('express');
const {
  getPriceTypesController,
  getPricingTypeDetailsByIdController,
} = require('../controllers/price-type-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

// Route for getting all users
router.get(
  '/',
  authorize(['view_prices', 'manage_prices']),
  getPriceTypesController
);

/**
 * GET /pricing-types/details
 * Fetch all pricing type details with associated products and locations.
 */
router.get(
  '/:id',
  authorize(['view_prices', 'manage_prices']),
  getPricingTypeDetailsByIdController
);

module.exports = router;
