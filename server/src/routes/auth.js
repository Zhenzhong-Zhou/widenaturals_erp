/**
 * @file auth.js
 * @description Authentication routes covering session logout, password change,
 * and placeholders for the password reset flow.
 *
 * CSRF protection is applied to all routes in this file.
 * No authorization middleware is used — these routes are session-scoped,
 * not permission-scoped.
 */

'use strict';

const express                          = require('express');
const { csrfMiddleware }               = require('../middlewares/csrf-protection');
const { createResetPasswordRateLimiter } = require('../middlewares/rate-limiter');
const validate                         = require('../middlewares/validate');
const { changePasswordSchema }         = require('../validators/auth/password-change');
const {
  logoutController,
  changePasswordController,
} = require('../controllers/auth-controller');

const router = express.Router();

/**
 * @route POST /auth/logout
 * @description Terminates the current user session.
 * @access protected
 * @permission authenticated
 */
router.post(
  '/logout',
  csrfMiddleware,
  logoutController
);

/**
 * @route POST /auth/change-password
 * @description Change the authenticated user's password. Rate-limited to
 * prevent brute-force attempts.
 * @access protected
 * @permission authenticated
 */
router.post(
  '/change-password',
  csrfMiddleware,
  createResetPasswordRateLimiter(),
  validate(changePasswordSchema, 'body'),
  changePasswordController
);

/**
 * @route POST /auth/forgot-password
 * @description Initiates a password reset by generating a reset token.
 * @access public
 * @todo Not yet implemented.
 */
router.post('/forgot-password', (req, res) => {
  res.status(501).json({ message: 'Forgot password route not implemented yet.' });
});

/**
 * @route POST /auth/verify-reset-token
 * @description Validates a password reset token before allowing the reset to proceed.
 * @access public
 * @todo Not yet implemented.
 */
router.post('/verify-reset-token', (req, res) => {
  res.status(501).json({ message: 'Verify reset token route not implemented yet.' });
});

module.exports = router;
