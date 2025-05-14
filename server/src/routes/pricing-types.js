/**
 * @file price_types.js
 * @description Routes related to user operations.
 */

const express = require('express');
const {
  getAllPriceTypesController,
  getPricingTypeMetadataController,
  getPricingTypesForDropdownController,
} = require('../controllers/pricing-type-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

/**
 * @route GET /pricing-types/
 * @description Fetch all pricing types available in the system.
 * @access Protected
 * @returns {Object} 200 - A list of pricing types with basic metadata.
 * @throws {500} If an internal server error occurs while fetching data.
 */
router.get(
  '/',
  authorize([
    'view_prices',
    'view_pricing_types',
    'view_pricing_config',
    'manage_pricing',
    'manage_catalog',
    'root_access',
  ]),
  getAllPriceTypesController
);

/**
 * @route GET /pricing-types/metadata/:id
 * @description Fetch pricing type metadata by ID.
 * @access Protected
 * @param {string} req.params.id - UUID of the pricing type.
 * @returns {Object} 200 - JSON object containing pricing type metadata.
 * @throws {404} If pricing type is not found.
 * @throws {500} If an internal server error occurs.
 */
router.get(
  '/metadata/:id',
  authorize([
    'view_prices',
    'view_pricing_types',
    'view_pricing_config',
    'manage_pricing',
    'manage_catalog',
    'root_access',
  ]),
  getPricingTypeMetadataController
);

router.get('/dropdown', getPricingTypesForDropdownController);

module.exports = router;
