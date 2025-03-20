/**
 * @file price_types.js
 * @description Routes related to user operations.
 */

const express = require('express');
const {
  getPriceTypesController,
  getPricingTypeDetailsByIdController,
  getPricingTypesForDropdownController,
} = require('../controllers/pricing-type-controller');
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
  '/details/:id',
  authorize(['view_prices', 'manage_prices']),
  getPricingTypeDetailsByIdController
);

router.get('/dropdown', getPricingTypesForDropdownController);

module.exports = router;
