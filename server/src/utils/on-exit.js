/**
 * @file on-exit.js
 * @description Utility function to handle process exits with centralized logic.
 */
const { closePool } = require('../database/db');

let loggerHelper; // Lazy-loaded logger helper
let server; // Server reference
let cleanupCalled = false;

/**
 * Lazy-loads the logger helper.
 */
const getLoggerHelper = () => {
  if (!loggerHelper) {
    loggerHelper = require('./logger-helper'); // Lazy import
  }
  return loggerHelper;
};

/**
 * Sets the server reference to be closed during shutdown.
 *
 * @param {object} serverInstance - The server instance to manage during cleanup.
 */
const setServer = (serverInstance) => {
  server = serverInstance;
};

/**
 * Cleanup logic to be executed during shutdown.
 */
const cleanupLogic = async () => {
  if (cleanupCalled) {
    getLoggerHelper().logWarn('Cleanup already in progress. Skipping redundant call.');
    return;
  }
  cleanupCalled = true;
  
  const logger = getLoggerHelper();
  logger.logInfo('Starting cleanup logic...');
  
  try {
    // Close server connections
    if (server) {
      logger.logInfo('Closing server connections...');
      await new Promise((resolve) => {
        server.close(() => {
          logger.logInfo('Server connections closed.');
          resolve();
        });
      });
    } else {
      logger.logInfo('No active server instance to close.');
    }
    
    // Close database pool
    logger.logInfo('Closing database pool...');
    await closePool();
    
    // Remove signal handlers
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    
    logger.logInfo('Database pool closed.');
  } catch (error) {
    logger.logFatal('Error during cleanup:', null, { error: error.message, stack: error.stack });
  }
};

/**
 * Handles process termination and ensures cleanup is only performed once.
 *
 * @param {number} [code=0] - The exit code (e.g., 0 for success, 1 for failure).
 */
const handleExit = async (code = 0) => {
  const logger = getLoggerHelper();
  
  try {
    logger.logInfo('Initiating exit process...');
    
    // Set a timeout for the cleanup process
    const timeout = setTimeout(() => {
      logger.logFatal('Cleanup exceeded timeout. Forcing exit.');
      process.exit(code);
    }, 10000); // 10 seconds timeout
    
    await cleanupLogic();
    clearTimeout(timeout);
    
    logger.logInfo('Cleanup completed successfully.');
  } catch (error) {
    logger.logFatal('Unexpected error during exit:', null, { error: error.message, stack: error.stack });
  } finally {
    logger.logInfo(`Exiting with code: ${code}`);
    process.exit(code);
  }
};

module.exports = { handleExit, setServer };
