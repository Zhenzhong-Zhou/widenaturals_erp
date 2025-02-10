/**
 * @file pricing.js
 * @description Routes related to user operations.
 */

const express = require('express');
const { getPricingsController, getPricingDetailsController } = require('../controllers/pricing-controller');
const authorize = require('../middlewares/authorize');


const router = express.Router();

// Route for getting all users
router.get('/', authorize(['view_prices', 'manage_prices']), getPricingsController);

router.get('/:id', authorize(['view_prices', 'manage_prices']), getPricingDetailsController);

module.exports = router;
