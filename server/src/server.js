/**
 * @file server.js
 * @description Initializes and starts the server.
 */

const http = require('http');
const { logInfo, logError } = require('./utils/logger-helper');
const app = require('./app');
const { createDatabaseAndInitialize } = require('./database/create-db');
const { closePool, testConnection } = require('./database/db');
const { initializeRootAdmin } = require('./config/initialize-root');

const PORT = process.env.PORT;
if (!PORT) {
  logError(new Error('PORT environment variable is missing or undefined'));
  process.exit(1);
}

// Create the server
const server = http.createServer(app);

/**
 * Starts the server after verifying the database connection and performing initializations.
 */
const startServer = async () => {
  try {
    logInfo('Initializing database...');
    await createDatabaseAndInitialize()
    
    logInfo('Testing database connection...');
    await testConnection();
    logInfo('Database connected successfully');
    
    logInfo('Initializing root admin...');
    await initializeRootAdmin(); // Call the initialization function
    logInfo('Root admin initialization completed.');
    
    logInfo('Starting server...');
    server.listen(PORT, () => {
      logInfo(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logError('Failed to start server:', error);
    process.exit(1); // Exit with failure code
  }
};

/**
 * Gracefully shuts down the server and cleans up resources.
 */
const shutdown = async () => {
  logInfo('Shutting down server...');
  server.close(async () => {
    logInfo('Server closed');
    await closePool();
    logInfo('Database connections closed');
    process.exit(0);
  });
};

/**
 * Stops the server manually (for development/testing purposes).
 */
const stopServer = () => {
  logInfo('Stopping server manually');
  server.close(() => {
    logInfo('Server stopped');
  });
};

// Handle system signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { startServer, shutdown, stopServer };
