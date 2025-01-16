/**
 * @file auth.js
 * @description Authentication-related routes.
 */

const express = require('express');
const {
  logoutController, resetPasswordController,
} = require('../controllers/auth-controller');
const validatePasswordSchema = require('../validators/password-validators');
const validate = require('../middlewares/validate');

const router = express.Router();

// Logout route
router.post('/logout', logoutController);

router.post('/reset-password', validate(validatePasswordSchema), resetPasswordController);

module.exports = router;
