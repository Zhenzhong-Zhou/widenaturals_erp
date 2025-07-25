/**
 * @file auth.js
 * @description Authentication-related routes.
 */

const express = require('express');
const {
  logoutController,
  resetPasswordController,
} = require('../controllers/auth-controller');
const { validatePasswordSchema } = require('../validators/password-validators');
const validate = require('../middlewares/validate');
const {
  createResetPasswordRateLimiter,
} = require('../middlewares/rate-limiter');
const validatePasswordStrength = require('../middlewares/validate-password-strength');
const { csrfMiddleware } = require('../middlewares/csrf-protection');

const router = express.Router();

// Logout route
router.post('/logout', csrfMiddleware, logoutController);

router.post(
  '/reset-password',
  csrfMiddleware,
  createResetPasswordRateLimiter(),
  validate(validatePasswordSchema),
  validatePasswordStrength,
  resetPasswordController
);

// Placeholder for forgot password routes
// To trigger a password reset process (e.g., generate reset token).
router.post('/forgot-password', (req, res) => {
  res
    .status(501)
    .json({ message: 'Forgot password route not implemented yet.' });
});

// To validate the reset token before allowing password reset.
router.post('/verify-reset-token', (req, res) => {
  res
    .status(501)
    .json({ message: 'Verify reset token route not implemented yet.' });
});

module.exports = router;
