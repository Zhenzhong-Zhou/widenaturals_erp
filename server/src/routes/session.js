/**
 * @file login.js
 * @description Defines the public route for user login. This route allows users to authenticate and obtain access and refresh tokens.
 * @module routes/login
 */

const express = require('express');
const validate = require('../middlewares/validate');
const validateAuthInputs = require('../validators/auth-validators');
const { loginController } = require('../controllers/session-controller');
const { refreshTokenController } = require('../controllers/auth-controller');

const router = express.Router();

/**
 * @route POST /login
 * @desc Handles user login.
 *       - Validates user credentials (email and password).
 *       - Issues access and refresh tokens upon successful authentication.
 *       - Returns a JSON response with success message and tokens.
 * @access Public
 */
router.post('/login', validate(validateAuthInputs), loginController);

// Refresh token route
router.post('/refresh', refreshTokenController);

module.exports = router;
