/**
 * @file pricing.js
 * @description Routes related to user operations.
 */

const express = require('express');
const {
  getPaginatedPricingRecordsController,
  getPricingDetailsController,
  getPriceByProductAndPriceTypeController, exportPricingRecordsController,
} = require('../controllers/pricing-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

// Route for getting all users
router.get(
  '/',
  authorize(['view_prices', 'manage_prices']),
  getPaginatedPricingRecordsController
);

router.get('/export', authorize([
  'export_pricing',
  'manage_prices',
]), exportPricingRecordsController);

router.get(
  '/details/:id',
  authorize(['view_prices', 'manage_prices']),
  getPricingDetailsController
);

router.get('/fetch-price', getPriceByProductAndPriceTypeController);

module.exports = router;
