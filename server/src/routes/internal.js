/**
 * @file internal.js
 * @description Defines routes for internal system operations, such as status checks.
 * These routes are intended for authorized internal use only.
 */

const express = require('express');
const { getInternalStatus } = require('../controllers/internal-controller');

const router = express.Router();

/**
 * GET /internal/status
 * Provides the internal system status for monitoring and diagnostics.
 *
 * This endpoint is restricted to authorized internal users, such as admins or internal tools.
 * Authorization middleware should be applied at a higher level or added here if required.
 *
 */
router.get('/status', getInternalStatus);

module.exports = router;
