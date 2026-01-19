/**
 * @file public-controller.js
 * @description Contains the logic for the public routes: Welcome and Health Check.
 */

const wrapAsync = require('../utils/wrap-async');
const { logInfo } = require('../utils/logger-helper');
const { version } = require('../../package.json');
const { checkServerHealthService } = require('../services/server-health-service');

/**
 * Controller: Public API welcome / discovery endpoint.
 *
 * Responsibilities:
 * - Provide basic API identity and version information
 * - Expose links to documentation and system health endpoints
 * - Serve as a lightweight discovery and smoke-test endpoint
 *
 * Notes:
 * - This endpoint is unauthenticated and publicly accessible
 * - Intended for human consumption and basic connectivity checks
 * - Does not expose internal system or dependency details
 */
const getWelcomeMessageController = wrapAsync(async (req, res) => {
  const context = 'system-controller/getWelcomeMessage';
  const traceId = `welcome-${Date.now().toString(36)}`;
  
  const API_PREFIX = process.env.API_PREFIX ?? '';
  
  // -------------------------------
  // Entry log
  // -------------------------------
  logInfo('Serving public welcome message', req, {
    context,
    traceId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  // -------------------------------
  // Response
  // -------------------------------
  res.status(200).json({
    system: 'WIDE Naturals Inc. ERP',
    message: 'Welcome to the WIDE Naturals Inc. ERP API',
    version,
    frontendVersion: process.env.FRONTEND_VERSION ?? null,
    documentation: `${API_PREFIX}/docs`,
    healthEndpoint: `${API_PREFIX}/public/health`,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Controller: Public API health check.
 *
 * Responsibilities:
 * - Execute lightweight server and dependency health checks
 * - Sanitize internal metrics for safe public exposure
 * - Log request entry, completion, and execution duration
 * - Return HTTP status codes suitable for load balancers and monitors
 *
 * Behavior:
 * - Returns 200 when the server is healthy
 * - Returns 503 when any critical dependency is unhealthy
 *
 * Notes:
 * - This endpoint is unauthenticated and publicly accessible
 * - No internal error messages or stack traces are exposed
 * - Designed for frequent polling with minimal overhead
 * - HTTP status code is the primary success/failure signal
 */
const getHealthStatusController = wrapAsync(async (req, res) => {
  const context = 'system-controller/getHealthStatus';
  const startTime = Date.now();
  const traceId = `health-${Date.now().toString(36)}`;
  
  // -------------------------------
  // 1. Entry log
  // -------------------------------
  logInfo('Incoming health check request', req, {
    context,
    traceId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  // -------------------------------
  // 2. Execute health check
  // -------------------------------
  const healthStatus = await checkServerHealthService();
  
  // Sanitize response for public exposure
  const publicHealthStatus = {
    server: healthStatus?.server ?? 'unhealthy',
    services: {
      database: { status: healthStatus?.services?.database?.status ?? 'unknown' },
      pool: { status: healthStatus?.services?.pool?.status ?? 'unknown' },
    },
    timestamp: healthStatus?.metrics?.timestamp ?? new Date().toISOString(),
  };
  
  const statusCode = healthStatus.server === 'healthy' ? 200 : 503;
  const elapsedMs = Date.now() - startTime;
  
  // -------------------------------
  // 3. Completion log
  // -------------------------------
  logInfo('Completed health check', req, {
    context,
    traceId,
    serverStatus: healthStatus.server,
    elapsedMs,
  });
  
  // -------------------------------
  // 4. Response
  // -------------------------------
  res.status(statusCode).json(publicHealthStatus);
});

module.exports = {
  getWelcomeMessageController,
  getHealthStatusController,
};
