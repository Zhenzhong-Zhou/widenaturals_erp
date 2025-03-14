const express = require('express');
const {
  fetchAllCompliancesController,
} = require('../controllers/compliance-controller');

const router = express.Router();

/**
 * @route GET /api/compliances
 * @desc Fetch all compliance records
 * @access Public
 */
router.get('/', fetchAllCompliancesController);

module.exports = router;
