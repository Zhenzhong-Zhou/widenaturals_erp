/**
 * @file index.js
 * @description Main route aggregator.
 */

const express = require('express');
const healthRoutes = require('./health');
const authRoutes = require('./auth');

const router = express.Router();

// Attach sub-routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Export the router
module.exports = router;
