/**
 * @file public.js
 * @description Defines the public routes for the API.
 */

const express = require('express');
const {
  getWelcomeMessageController,
  getHealthStatusController,
} = require('../controllers/public-controller');
const noStoreMiddleware = require('../middlewares/noStoreMiddleware');
const { createHealthRateLimiter } = require('../middlewares/rate-limiter');

const router = express.Router();

/**
 * GET /public/welcome
 *
 * Public discovery endpoint.
 *
 * Purpose:
 * - Provide basic API identity and version information
 * - Offer links to documentation and health endpoints
 * - Serve as a human-readable entry point and smoke test
 *
 * Notes:
 * - Unauthenticated and publicly accessible
 * - Not intended for automation or monitoring
 * - Responses are never cached
 */
router.get('/welcome', noStoreMiddleware, getWelcomeMessageController);

/**
 * GET /public/health
 *
 * Public system health endpoint.
 *
 * Purpose:
 * - Report application health to load balancers and monitors
 * - Signal availability using HTTP status codes
 *
 * Behavior:
 * - Returns 200 when healthy
 * - Returns 503 when unhealthy
 *
 * Notes:
 * - Unauthenticated and publicly accessible
 * - Designed for frequent polling
 * - Protected by a dedicated rate limiter
 * - Responses are never cached
 */
router.get(
  '/health',
  noStoreMiddleware,
  createHealthRateLimiter(),
  getHealthStatusController
);

module.exports = router;
