/**
 * @file server.js
 * @description Initializes and starts the server, including database monitoring, health checks, and cleanup.
 */

const http = require('http');
const { logInfo, logError, logDebug } = require('./utils/logger-helper');
const AppError = require('./utils/AppError');
const { handleExit } = require('./utils/on-exit');
const app = require('./app');
const { createDatabaseAndInitialize } = require('./database/create-db');
const { testConnection } = require('./database/db');
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
    logError(new AppError('PORT environment variable is missing or undefined'));
    await handleExit(1);
  }

  try {
    // Database initialization
    logInfo('Initializing database...');
    await createDatabaseAndInitialize();

    logInfo('Testing database connection...');
    await testConnection();
    logInfo('Database connected successfully.');

    // Root admin initialization
    logInfo('Initializing root admin...');
    await initializeRootAdmin();
    logInfo('Root admin initialization completed.');

    // Starting the server
    logInfo('Starting server...');
    server = http.createServer(app);

    // Health check scheduling
    const healthCheckInterval =
      parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || ONE_MINUTE;

    // Schedule health checks
    await startHealthCheck(healthCheckInterval);

    // Log health check at the same interval
    const healthCheckId = setInterval(
      () => logInfo('Health check running...'),
      healthCheckInterval
    );
    activeIntervals.add(healthCheckId); // Track interval for cleanup

    // Start pool monitoring
    startPoolMonitoring();

    server.listen(PORT, () => {
      logInfo(`Server running at http://localhost:${PORT}`);
    });

    return server;
  } catch (error) {
    logError('Failed to start server:', { error: error.message });
    throw error;
  }
};

/**
 * Gracefully shuts down the server and performs cleanup tasks.
 */
const shutdownServer = async () => {
  logInfo('Shutting down server...');

  // Set a timeout to force shutdown if it hangs
  const timeout = setTimeout(() => {
    logError('Shutdown timeout reached. Forcing exit.');
    process.exit(1); // Force exit with failure if timeout is reached
  }, 10000); // Adjust timeout as needed

  try {
    // Perform a final backup
    try {
      logInfo('Performing final database backup before shutdown...');
      await runBackup();
      logInfo('Final backup completed successfully.');
    } catch (error) {
      logError('Error during final backup:', { error: error.message });
    }

    // Clear active intervals
    logInfo('Clearing active intervals...');
    activeIntervals.forEach((intervalId) => clearInterval(intervalId));
    logInfo('All active intervals cleared.');

    // Check active connections
    if (server) {
      server.getConnections((err, count) => {
        if (err) {
          logError('Error getting active connections:', { error: err.message });
        } else {
          logInfo(`Active connections: ${count}`);
        }
      });

      // Close the HTTP server
      logInfo('Closing HTTP server...');
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logError('Error during server shutdown:', { error: err.message });
            reject(err);
          } else {
            logInfo('HTTP server closed successfully.');
            resolve();
          }
        });
      });
    }

    // Stop health checks
    try {
      logInfo('Stopping health checks...');
      stopHealthCheck();
    } catch (error) {
      logError('Error stopping health checks:', { error: error.message });
    }

    // Stop pool monitoring
    try {
      logInfo('Stopping pool monitoring...');
      if (isPoolMonitoringRunning()) {
        stopPoolMonitoring();
      } else {
        logDebug('Pool monitoring was not running.');
      }
    } catch (error) {
      logError('Error stopping pool monitoring:', { error: error.message });
    }

    // Clear timeout to prevent force exit
    clearTimeout(timeout);
    logInfo('Cleanup completed successfully.');
  } catch (error) {
    clearTimeout(timeout);
    logError('Error during shutdown:', { error: error.message });
    await handleExit(1); // Exit with failure
  }
};

module.exports = { startServer, shutdownServer };
