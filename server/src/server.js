/**
 * @file server.js
 * @description Initializes and starts the server, including database monitoring.
 */

const http = require('http');
const { logInfo, logError } = require('./utils/logger-helper');
const app = require('./app');
const { createDatabaseAndInitialize } = require('./database/create-db');
const { testConnection } = require('./database/db');
const { initializeRootAdmin } = require('./config/initialize-root');
const { handleExit } = require('./utils/on-exit');
const { startPoolMonitoring, stopPoolMonitoring } = require('./monitors/pool-health');
const { startHealthCheck, stopHealthCheck } = require('./monitors/health-check');

// Create the server
let server;

/**
 * Starts the server after verifying the database connection and performing initializations.
 * @returns {object} The server instance.
 */
const startServer = async () => {
  const PORT = process.env.PORT;
  if (!PORT) {
    logError(new Error('PORT environment variable is missing or undefined'));
    await handleExit(1);
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
    await startHealthCheck(60000); // Schedule health checks every 1 minute
    server.listen(PORT, () => {
      logInfo(`Server running at http://localhost:${PORT}`);
    });
    
    // Start pool monitoring
    startPoolMonitoring();
    
    return server;
  } catch (error) {
    logError('Failed to start server:', error);
    throw error;
  }
};

const shutdownServer = async () => {
  logInfo('Shutting down server...');
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logError('Error during server shutdown:', err.message);
            reject(err);
          } else {
            logInfo('Server shutdown successfully.');
            resolve();
          }
        });
      });
    }
    stopHealthCheck(); // Stop scheduled health checks
    stopPoolMonitoring(); // Stop database pool monitoring
  } catch (error) {
    logError('Error during shutdown:', error.message);
    throw error;
  }
};

module.exports = { startServer, shutdownServer };
