const express = require('express');
const { getLocationTypesController } = require('../controllers/location-type-controller');

const router = express.Router();

/**
 * @desc    Fetch all location types (Paginated)
 * @route   GET /api/location-types
 * @access  Protected
 */
router.get('/', getLocationTypesController);

module.exports = router;
