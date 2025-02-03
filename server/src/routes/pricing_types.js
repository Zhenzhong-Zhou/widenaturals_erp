/**
 * @file price_types.js
 * @description Routes related to user operations.
 */

const express = require('express');
const { getPriceTypesController, getPricingTypeDetailsByIdController } = require('../controllers/price-type-controller');


const router = express.Router();

// Route for getting all users
router.get('/', getPriceTypesController);

/**
 * GET /pricing-types/details
 * Fetch all pricing type details with associated products and locations.
 */
router.get('/:id', getPricingTypeDetailsByIdController);

module.exports = router;
