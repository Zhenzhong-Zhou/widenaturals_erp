/**
 * @file index.js
 * @description Main route aggregator.
 */

const express = require('express');
const welcomeRoute = require('./welcome');
const healthRoutes = require('./health');
const authRoutes = require('./auth');

const router = express.Router();

// Attach sub-routes
router.use('/', welcomeRoute);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Export the router
module.exports = router;
