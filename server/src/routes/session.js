/**
 * @file login.js
 * @description Defines the public route for user login. This route allows users to authenticate and obtain access and refresh tokens.
 * @module routes/login
 */

const express = require('express');
const validate = require('../middlewares/validate');
const validateAuthInputs = require('../validators/auth-validators');
const {
  loginController,
  refreshTokenController,
} = require('../controllers/session-controller');
const { createLoginRateLimiter, createRefreshRateLimiter } = require('../middlewares/rate-limiter');

const router = express.Router();

/**
 * @route POST /login
 * @desc Handles user login.
 *       - Validates user credentials (email and password).
 *       - Issues access and refresh tokens upon successful authentication.
 *       - Returns a JSON response with success message and tokens.
 * @access Public
 */
router.post('/login', createLoginRateLimiter(), validate(validateAuthInputs), loginController);

// Refresh token route
router.post('/refresh', createRefreshRateLimiter(), refreshTokenController);

// Placeholder for session tracking routes
// To track an active session (e.g., metadata like IP, device).
router.post('/track', (req, res) => {
  res
    .status(501)
    .json({ message: 'Session tracking route not implemented yet.' });
});

// To terminate a specific session.
router.post('/terminate', (req, res) => {
  res
    .status(501)
    .json({ message: 'Session termination route not implemented yet.' });
});

// To terminate all active sessions for a user.
router.post('/terminate-all', (req, res) => {
  res
    .status(501)
    .json({ message: 'Terminate all sessions route not implemented yet.' });
});

module.exports = router;
