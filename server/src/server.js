/**
 * @file server.js
 * @description Initializes and starts the server, including database monitoring, health checks, and cleanup.
 */

const http = require('http');
const {
  logSystemInfo,
  logSystemError,
  logMissingEnvVar,
  logSystemDebug,
  logSystemException,
} = require('./utils/system-logger');
const AppError = require('./utils/AppError');
const { handleExit } = require('./utils/on-exit');
const app = require('./app');
const { createDatabaseAndInitialize } = require('./database/create-db');
const { testConnection } = require('./database/db');
const { initStatusCache } = require('./config/status-cache');
const { initializeRootAdmin } = require('./config/initialize-root');
const {
  startPoolMonitoring,
  stopPoolMonitoring,
  isPoolMonitoringRunning,
} = require('./monitors/pool-health');
const {
  startHealthCheck,
  stopHealthCheck,
} = require('./monitors/health-check');
const { ONE_MINUTE } = require('./utils/constants/general/time');
const { runBackup } = require('./tasks/schedulers/backup-scheduler');

let server; // HTTP server instance
const activeIntervals = new Set(); // Tracks active intervals for cleanup

/**
 * Starts the server after verifying the database connection and performing initializations.
 * @returns {object} The server instance.
 */
const startServer = async () => {
  const PORT = process.env.PORT;
  if (!PORT) {
    const error = new AppError(
      'PORT environment variable is missing or undefined'
    );
    logMissingEnvVar('PORT', error);
    await handleExit(1);
  }

  try {
    // Database initialization
    logSystemInfo('Initializing database...');
    await createDatabaseAndInitialize();

    logSystemInfo('Testing database connection...');
    await testConnection();
    logSystemInfo('Database connected successfully.');

    logSystemInfo('Initializing status ID cache...');
    await initStatusCache();
    logSystemInfo('Status ID cache initialized.');

    // Root admin initialization
    logSystemInfo('Initializing root admin...');
    await initializeRootAdmin();
    logSystemInfo('Root admin initialization completed.');

    // Starting the server
    logSystemInfo('Starting server...');
    server = http.createServer(app);

    // Health check scheduling
    const healthCheckInterval =
      parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || ONE_MINUTE;
    await startHealthCheck(healthCheckInterval);

    // Log health check at the same interval
    const healthCheckId = setInterval(() => {
      logSystemInfo('Health check running...');
    }, healthCheckInterval);
    activeIntervals.add(healthCheckId);

    // Start pool monitoring
    startPoolMonitoring();

    server.listen(PORT, () => {
      logSystemInfo(`Server running at http://localhost:${PORT}`);
    });

    return server;
  } catch (error) {
    logSystemException(error, 'Failed to start server', {
      context: 'startup',
      severity: 'critical',
    });
    throw error;
  }
};

/**
 * Gracefully shuts down the server and performs cleanup tasks.
 */
const shutdownServer = async () => {
  logSystemInfo('Shutting down server...');

  // Set a timeout to force shutdown if it hangs
  const timeout = setTimeout(() => {
    logSystemError('Shutdown timeout reached. Forcing exit.', {
      severity: 'critical',
    });
    process.exit(1); // Force exit with failure if timeout is reached
  }, 10000); // Adjust timeout as needed

  try {
    // Perform a final backup
    try {
      logSystemInfo('Performing final database backup before shutdown...');
      await runBackup();
      logSystemInfo('Final backup completed successfully.');
    } catch (error) {
      logSystemException(error, 'Error during final backup');
    }

    // Clear active intervals
    logSystemInfo('Clearing active intervals...');
    activeIntervals.forEach((intervalId) => clearInterval(intervalId));
    logSystemInfo('All active intervals cleared.');

    // Check active connections
    if (server) {
      server.getConnections((err, count) => {
        if (err) {
          logSystemException(err, 'Error getting active connections');
        } else {
          logSystemInfo(`Active connections: ${count}`);
        }
      });

      // Close the HTTP server
      logSystemInfo('Closing HTTP server...');
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logSystemException(err, 'Error during server shutdown');
            reject(err);
          } else {
            logSystemInfo('HTTP server closed successfully.');
            resolve();
          }
        });
      });
    }

    // Stop health checks
    try {
      logSystemInfo('Stopping health checks...');
      stopHealthCheck();
    } catch (error) {
      logSystemException(error, 'Error stopping health checks');
    }

    // Stop pool monitoring
    try {
      logSystemInfo('Stopping pool monitoring...');
      if (isPoolMonitoringRunning()) {
        stopPoolMonitoring();
      } else {
        logSystemDebug('Pool monitoring was not running.');
      }
    } catch (error) {
      logSystemException(error, 'Error stopping pool monitoring');
    }

    // Clear timeout to prevent force exit
    clearTimeout(timeout);
    logSystemInfo('Cleanup completed successfully.');
  } catch (error) {
    clearTimeout(timeout);
    logSystemException(error, 'Error during shutdown', {
      severity: 'critical',
    });
    await handleExit(1); // Exit with failure
  }
};

module.exports = { startServer, shutdownServer };
