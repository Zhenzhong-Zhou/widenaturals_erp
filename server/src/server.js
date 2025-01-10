/**
 * @file server.js
 * @description Initializes and starts the server.
 */

const http = require('http');
const { logInfo, logError } = require('./utils/logger-helper');
const app = require('./app');
const { createDatabaseAndInitialize } = require('./database/create-db');
const { testConnection } = require('./database/db');
const { initializeRootAdmin } = require('./config/initialize-root');
const { handleExit } = require('./utils/on-exit');

// Create the server
const server = http.createServer(app);

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
    server.listen(PORT, () => {
      logInfo(`Server running on http://localhost:${PORT}`);
    });
    
    return server;
  } catch (error) {
    logError('Failed to start server:', error);
    throw error;
  }
};

module.exports = { startServer };
