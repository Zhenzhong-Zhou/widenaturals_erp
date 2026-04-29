/**
 * @file server-health-service.js
 * @description Server health check and status monitoring.
 *
 * Exports:
 *   - checkServerHealthService – aggregates infrastructure health into a single snapshot
 *
 * This service is exempt from the no-success-logging rule — health checks are
 * infrastructure monitoring, not business logic. Logging at the point of detection
 * is the only observability mechanism since this function must never throw.
 */

'use strict';

const { checkDatabaseHealth } = require('../system/health/db-health');
const { monitorPool } = require('../database/db');
const {
  logSystemInfo,
  logSystemException,
} = require('../utils/logging/system-logger');

const CONTEXT = 'server-health-service';

/**
 * Performs a comprehensive server health check.
 *
 * Probes availability of critical infrastructure dependencies and aggregates
 * system-level health signals into a single snapshot.
 *
 * Guarantees:
 * - This function MUST NEVER throw — all failures are represented via status flags.
 * - Returned data may contain internal-only diagnostics (`_internal` fields).
 *
 * Notes:
 * - Does NOT perform access control or data sanitization.
 * - Controllers are responsible for filtering fields before sending to clients.
 *
 * @returns {Promise<{
 *   server: 'healthy'|'unhealthy',
 *   services: {
 *     database: { status: string, _internal?: Object },
 *     pool:     { status: string, _internal?: Object },
 *   },
 *   metrics: {
 *     uptime: number,
 *     timestamp: string,
 *     _internal: { memoryUsage: Object }
 *   }
 * }>}
 */
const checkServerHealthService = async () => {
  const isDev = process.env.NODE_ENV === 'development';

  const status = {
    server: 'healthy',
    services: {
      database: { status: 'unknown' },
      pool: { status: 'unknown' },
    },
    metrics: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      // Internal-only metrics — never expose via public API response.
      _internal: {
        memoryUsage: process.memoryUsage(),
      },
    },
  };

  // Database health
  try {
    const dbStatus = await checkDatabaseHealth();

    status.services.database = {
      status: dbStatus.status,
      _internal: dbStatus,
    };

    logSystemInfo('Database health check passed', {
      context: `${CONTEXT}/database`,
      // Include full metrics in dev for diagnostics; keep log lean in production.
      ...(isDev && { metrics: dbStatus }),
    });
  } catch (error) {
    status.server = 'unhealthy';
    status.services.database = { status: 'unhealthy' };

    logSystemException(error, 'Database health check failed', {
      context: `${CONTEXT}/database`,
    });
  }

  // Pool health
  try {
    const poolMetrics = await monitorPool();

    status.services.pool = {
      status: 'healthy',
      _internal: poolMetrics,
    };

    logSystemInfo('Pool health check passed', {
      context: `${CONTEXT}/pool`,
      ...(isDev && { metrics: poolMetrics }),
    });
  } catch (error) {
    status.server = 'unhealthy';
    status.services.pool = { status: 'unhealthy' };

    logSystemException(error, 'Pool health check failed', {
      context: `${CONTEXT}/pool`,
    });
  }

  return status;
};

module.exports = {
  checkServerHealthService,
};
