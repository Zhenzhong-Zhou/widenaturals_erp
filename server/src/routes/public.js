/**
 * @file public.js
 * @description Defines the public routes for the API.
 */

const express = require('express');
const { getWelcomeMessage, getHealthStatus } = require('../controllers/public-controller');
const wrapAsync = require('../utils/wrap-async');

const router = express.Router();

/**
 * GET /public/welcome
 * Public route to display the welcome message.
 */
router.get('/welcome', wrapAsync(getWelcomeMessage));

/**
 * GET /public/health
 * Public route to check the health status of the application.
 */
router.get('/health', wrapAsync(getHealthStatus));

module.exports = router;
