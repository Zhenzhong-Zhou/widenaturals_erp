/**
 * @file auth.js
 * @description Authentication-related routes.
 */

const express = require('express');
const { signup, loginController, refreshTokenController } = require('../controllers/auth-controller');

const router = express.Router();

// Login route
router.post('/login', loginController);

// Signup route
router.post('/signup', signup);

// Refresh token route
router.post('/refresh', refreshTokenController);

module.exports = router;
