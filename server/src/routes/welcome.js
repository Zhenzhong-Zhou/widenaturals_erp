/**
 * @file welcome.js
 * @description Defines the welcome route for the API.
 */

const express = require('express');
const { getWelcomeMessage } = require('../controllers/welcome-controller');

const router = express.Router();

/**
 * GET /
 * Public route to display the welcome message.
 */
router.get('/', getWelcomeMessage);

module.exports = router;
