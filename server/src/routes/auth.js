/**
 * @file auth.js
 * @description Authentication-related routes.
 */

const express = require('express');
const {
  logoutController,
  refreshTokenController,
} = require('../controllers/auth-controller');

const router = express.Router();

// Logout route
router.post('/logout', logoutController);

// Refresh token route
router.post('/refresh', refreshTokenController);

module.exports = router;
