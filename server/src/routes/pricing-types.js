/**
 * @file price_types.js
 * @description Routes related to user operations.
 */

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const {
  getAllPriceTypesController,
  getPricingTypeMetadataController,
  getPricingTypesForDropdownController,
} = require('../controllers/pricing-type-controller');

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
  authorize([PERMISSIONS.PRICING_TYPES.VIEW]),
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
  authorize([PERMISSIONS.PRICING_TYPES.VIEW_PRICING_TYPES_DETAILS]),
  getPricingTypeMetadataController
);

router.get('/dropdown', getPricingTypesForDropdownController);

module.exports = router;
