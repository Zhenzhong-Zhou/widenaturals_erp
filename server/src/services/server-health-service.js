/**
 * @file server-health-service.js
 * @description Server health check and status monitoring.
 */

const { checkDatabaseHealth } = require('../monitors/db-health');
const { monitorPool } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');

/**
 * Performs a comprehensive server health check.
 *
 * Responsibilities:
 * - Probe availability of critical infrastructure dependencies
 * - Aggregate system-level health signals into a single snapshot
 *
 * Guarantees:
 * - This function MUST NEVER throw
 * - All failures are represented via status flags
 * - Returned data may contain internal-only diagnostics
 *
 * Notes:
 * - This function does NOT perform access control or data sanitization
 * - Controllers are responsible for filtering exposed fields
 * - Diagnostic metrics are collected for internal observability only
 */
const checkServerHealthService = async () => {
  const status = {
    server: 'healthy',
    services: {
      database: { status: 'unknown' },
      pool: { status: 'unknown' },
    },
    metrics: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),

      // Internal-only metrics (NEVER exposed via API)
      _internal: {
        memoryUsage: process.memoryUsage(),
      },
    },
  };

  // -------------------------------
  // Database health
  // -------------------------------
  try {
    const dbStatus = await checkDatabaseHealth();

    status.services.database = {
      status: dbStatus.status,
      _internal: dbStatus,
    };

    logSystemInfo('Database health check passed', {
      context: 'health-check',
      service: 'database',
    });

    // Dev-only diagnostics
    if (process.env.NODE_ENV === 'development') {
      logSystemInfo('Database health metrics (dev only)', {
        context: 'health-check',
        service: 'database',
        metrics: dbStatus,
      });
    }
  } catch (error) {
    status.server = 'unhealthy';
    status.services.database = { status: 'unhealthy' };

    logSystemException(error, 'Database health check failed', {
      context: 'health-check',
      service: 'database',
    });
  }

  // -------------------------------
  // Pool health
  // -------------------------------
  try {
    const poolMetrics = await monitorPool();

    status.services.pool = {
      status: 'healthy',
      _internal: poolMetrics,
    };

    logSystemInfo('Pool health check passed', {
      context: 'health-check',
      service: 'pool',
    });

    // Dev-only diagnostics
    if (process.env.NODE_ENV === 'development') {
      logSystemInfo('Pool metrics snapshot (dev only)', {
        context: 'health-check',
        service: 'pool',
        metrics: poolMetrics,
      });
    }
  } catch (error) {
    status.server = 'unhealthy';
    status.services.pool = { status: 'unhealthy' };

    logSystemException(error, 'Pool health check failed', {
      context: 'health-check',
      service: 'pool',
    });
  }

  return status;
};

module.exports = {
  checkServerHealthService,
};
