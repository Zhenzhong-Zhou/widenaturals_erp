/**
 * @file pricing.js
 * @description Routes related to user operations.
 */

const express = require('express');
const {
  getPricingsController,
  getPricingDetailsController, getPriceByProductAndPriceTypeController,
} = require('../controllers/pricing-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

// Route for getting all users
router.get(
  '/',
  authorize(['view_prices', 'manage_prices']),
  getPricingsController
);

router.get(
  '/details/:id',
  authorize(['view_prices', 'manage_prices']),
  getPricingDetailsController
);

router.get('/fetch-price', getPriceByProductAndPriceTypeController);

module.exports = router;
