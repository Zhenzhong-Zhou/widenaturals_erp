const express = require('express');
const { getLocationTypesController, getLocationTypeDetailController } = require('../controllers/location-type-controller');

const router = express.Router();

/**
 * @desc    Fetch all location types (Paginated)
 * @route   GET /api/location-types
 * @access  Protected
 */
router.get('/', getLocationTypesController);

/**
 * GET /location-types/:id
 * Fetch location type details by ID.
 */
router.get('/:id', getLocationTypeDetailController);

module.exports = router;
