const express = require('express');
const { createCsrfTokenRateLimiter } = require('../middlewares/rate-limiter');
const {
  generateCsrfTokenController,
} = require('../controllers/csrf-controller');

const router = express.Router();

/**
 * CSRF token endpoint.
 *
 * Used by the frontend to retrieve a per-session CSRF token.
 * The token must be included with subsequent state-changing
 * requests to satisfy CSRF protection.
 */
router.get(
  '/token',
  createCsrfTokenRateLimiter(),
  generateCsrfTokenController
);

module.exports = router;
