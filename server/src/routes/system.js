/**
 * @file system.js
 * @description Defines routes related to system-level operations, such as status checks.
 */

const express = require('express');
const { getSystemStatus } = require('../controllers/system-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

/**
 * GET /system/status
 * Provides comprehensive system health status.
 *
 * This route is intended for monitoring system-level operations,
 * providing detailed health and status information.
 */
router.get('/status', authorize(['view_system', 'view_system_status']), getSystemStatus);

module.exports = router;
