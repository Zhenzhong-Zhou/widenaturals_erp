/**
 * @file csrf.js
 * @description CSRF token issuance route.
 *
 * Used by the frontend to retrieve a per-session CSRF token before
 * making any state-changing requests. Rate-limited to prevent token
 * farming. No authentication or permission check required.
 */

'use strict';

const express = require('express');
const { createCsrfTokenRateLimiter } = require('../middlewares/rate-limiter');
const {
  generateCsrfTokenController,
} = require('../controllers/csrf-controller');

const router = express.Router();

/**
 * @route GET /csrf/token
 * @description Returns a per-session CSRF token for use in subsequent
 * state-changing requests.
 * @access public
 */
router.get('/token', createCsrfTokenRateLimiter(), generateCsrfTokenController);

module.exports = router;
