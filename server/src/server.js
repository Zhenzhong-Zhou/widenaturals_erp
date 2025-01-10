/**
 * @file server.js
 * @description Initializes and starts the server, including database monitoring and health checks.
 */

const http = require('http');
const { logInfo, logError, logDebug } = require('./utils/logger-helper');
const app = require('./app');
const { createDatabaseAndInitialize } = require('./database/create-db');
const { testConnection } = require('./database/db');
const { initializeRootAdmin } = require('./config/initialize-root');
const { startPoolMonitoring, stopPoolMonitoring, isPoolMonitoringRunning } = require('./monitors/pool-health');
const { startHealthCheck, stopHealthCheck } = require('./monitors/health-check');
const { ONE_MINUTE } = require('./utils/constants/general/time');

let server;

/**
 * Starts the server after verifying the database connection and performing initializations.
 * @returns {object} The server instance.
 */
const startServer = async () => {
  const PORT = process.env.PORT;
  if (!PORT) {
    logError(new Error('PORT environment variable is missing or undefined'));
    process.exit(1);
  }
  
  try {
    logInfo('Initializing database...');
    await createDatabaseAndInitialize();
    
    logInfo('Testing database connection...');
    await testConnection();
    logInfo('Database connected successfully.');
    
    logInfo('Initializing root admin...');
    await initializeRootAdmin();
    logInfo('Root admin initialization completed.');
    
    logInfo('Starting server...');
    server = http.createServer(app);
    
    const healthCheckInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || ONE_MINUTE;
    await startHealthCheck(healthCheckInterval); // Schedule health checks
    
    server.listen(PORT, () => {
      logInfo(`Server running at http://localhost:${PORT}`);
    });
    
    startPoolMonitoring(); // Start pool monitoring
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
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logError('Error during server shutdown:', { error: err.message });
            reject(err);
          } else {
            logInfo('Server shutdown successfully.');
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
      logInfo('Stopping database monitoring...');
      if (isPoolMonitoringRunning()) {
        stopPoolMonitoring();
      } else {
        logDebug('Pool monitoring was not running.');
      }
    } catch (error) {
      logError('Error stopping database monitoring:', { error: error.message });
    }
    
    logInfo('Server and associated services shut down successfully.');
  } catch (error) {
    logError('Error during shutdown process:', { error: error.message });
    throw error;
  }
};

module.exports = { startServer, shutdownServer };
