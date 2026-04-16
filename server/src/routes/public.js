/**
 * @file public.js
 * @description Public utility routes. No authentication required.
 * Covers API welcome message and server health status.
 */

'use strict';

const express = require('express');
const { createHealthRateLimiter } = require('../middlewares/rate-limiter');
const noStoreMiddleware = require('../middlewares/no-store');
const {
  getWelcomeMessageController,
  getHealthStatusController,
} = require('../controllers/public-controller');

const router = express.Router();

/**
 * @route GET /public/welcome
 * @description Returns a static welcome message confirming the API is reachable.
 * @access public
 */
router.get('/welcome', noStoreMiddleware, getWelcomeMessageController);

/**
 * @route GET /public/health
 * @description Returns current server health status. Rate-limited to prevent abuse.
 * Response is never cached (`no-store`).
 * @access public
 */
router.get(
  '/health',
  noStoreMiddleware,
  createHealthRateLimiter(),
  getHealthStatusController
);

module.exports = router;
