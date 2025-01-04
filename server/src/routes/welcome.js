/**
 * @file welcome.js
 * @description Defines the welcome route for the API.
 */

const express = require('express');
const { getWelcomeMessage } = require('../controllers/welcome-controller');
const wrapAsync = require('../utils/wrapAsync');

const router = express.Router();

/**
 * GET /
 * Public route to display the welcome message.
 */
router.get('/', wrapAsync(getWelcomeMessage));

module.exports = router;
