/**
 * @file auth.js
 * @description Authentication-related routes.
 */

const express = require('express');
const {
  logoutController,
  resetPasswordController,
} = require('../controllers/auth-controller');
const validatePasswordSchema = require('../validators/password-validators');
const validate = require('../middlewares/validate');

const router = express.Router();

// Logout route
router.post('/logout', logoutController);

router.post(
  '/reset-password',
  validate(validatePasswordSchema),
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
