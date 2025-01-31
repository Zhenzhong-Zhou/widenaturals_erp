/**
 * @file pricing.js
 * @description Routes related to user operations.
 */

const express = require('express');
const { getPricingsController, getPricingDetailsController } = require('../controllers/pricing-controller');


const router = express.Router();

// Route for getting all users
router.get('/', getPricingsController);

router.get('/:id', getPricingDetailsController);

module.exports = router;
