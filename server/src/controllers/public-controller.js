/**
 * @file public-controller.js
 * @module controllers/system-controller
 *
 * @description
 * Controllers for public system endpoints.
 *
 * Routes:
 *   GET /api/v1/public/welcome  → getWelcomeMessageController
 *   GET /api/v1/public/health   → getHealthStatusController
 *
 * These are unauthenticated public endpoints — no auth middleware,
 * no req.normalizedQuery, no req.auth.user.
 *
 * Logging:
 *   Transport-level logs are emitted automatically by the global request-logger
 *   middleware via res.on('finish'). No controller-level logging needed.
 *
 * Health response:
 *   Internal service details are sanitized before exposure — only server
 *   status, database status, and pool status are returned publicly.
 *   statusCode is derived from health result: 200 (healthy) | 503 (unhealthy).
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const { version }          = require('../../package.json');
const {
  checkServerHealthService,
} = require('../services/server-health-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/public/welcome
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a public welcome message and API entry point metadata.
 *
 * @route  GET /api/v1/public/welcome
 * @access Public
 */
const getWelcomeMessageController = wrapAsyncHandler(async (req, res) => {
  const API_PREFIX = process.env.API_PREFIX ?? '';
  
  res.status(200).json({
    system:          'WIDE Naturals Inc. ERP',
    message:         'Welcome to the WIDE Naturals Inc. ERP API',
    version,
    frontendVersion: process.env.FRONTEND_VERSION ?? null,
    documentation:   `${API_PREFIX}/docs`,
    healthEndpoint:  `${API_PREFIX}/public/health`,
    timestamp:       new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/public/health
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns sanitized server and dependency health status.
 *
 * Internal service details are intentionally omitted from the public response.
 * Responds 200 when healthy, 503 when any critical dependency is unhealthy.
 *
 * @route  GET /api/v1/public/health
 * @access Public
 */
const getHealthStatusController = wrapAsyncHandler(async (req, res) => {
  const healthStatus = await checkServerHealthService();
  
  // Sanitize — never expose internal service details on a public endpoint
  const publicHealthStatus = {
    server:   healthStatus?.server ?? 'unhealthy',
    services: {
      database: { status: healthStatus?.services?.database?.status ?? 'unknown' },
      pool:     { status: healthStatus?.services?.pool?.status    ?? 'unknown' },
    },
    timestamp: healthStatus?.metrics?.timestamp ?? new Date().toISOString(),
  };
  
  const statusCode = healthStatus.server === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(publicHealthStatus);
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getWelcomeMessageController,
  getHealthStatusController,
};
