/**
 * @file sessions.js
 * @description Session lifecycle routes covering login, token refresh,
 * and placeholders for session tracking and termination.
 *
 * No CSRF or authorization middleware is used — these routes are the
 * entry point for establishing a session, not operating within one.
 */

'use strict';

const express = require('express');
const {
  createLoginRateLimiter,
  createRefreshRateLimiter,
} = require('../middlewares/rate-limiter');
const validate = require('../middlewares/validate');
const { loginSchema } = require('../validators/auth/login');
const {
  loginController,
  refreshTokenController,
} = require('../controllers/session-controller');

const router = express.Router();

/**
 * @route POST /sessions/login
 * @description Authenticate a user and issue a new session. Rate-limited
 * to prevent brute-force attacks.
 * @access public
 */
router.post(
  '/login',
  createLoginRateLimiter(),
  validate(loginSchema, 'body'),
  loginController
);

/**
 * @route POST /sessions/refresh
 * @description Issue a new access token using a valid refresh token.
 * Rate-limited to prevent token refresh abuse.
 * @access public
 */
router.post('/refresh', createRefreshRateLimiter(), refreshTokenController);

/**
 * @route POST /sessions/track
 * @description Track metadata for an active session (e.g. IP, device info).
 * @access protected
 * @todo Not yet implemented.
 */
router.post('/track', (req, res) => {
  res
    .status(501)
    .json({ message: 'Session tracking route not implemented yet.' });
});

/**
 * @route POST /sessions/terminate
 * @description Terminate a specific active session.
 * @access protected
 * @todo Not yet implemented.
 */
router.post('/terminate', (req, res) => {
  res
    .status(501)
    .json({ message: 'Session termination route not implemented yet.' });
});

/**
 * @route POST /sessions/terminate-all
 * @description Terminate all active sessions for the current user.
 * @access protected
 * @todo Not yet implemented.
 */
router.post('/terminate-all', (req, res) => {
  res
    .status(501)
    .json({ message: 'Terminate all sessions route not implemented yet.' });
});

module.exports = router;
