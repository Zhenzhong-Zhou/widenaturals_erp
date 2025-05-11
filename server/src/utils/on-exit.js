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
    getLoggerHelper().logSystemWarn(
      'Cleanup already in progress. Skipping redundant call.'
    );
    return;
  }
  cleanupCalled = true;

  const logger = getLoggerHelper();
  logger.logSystemInfo('Starting cleanup logic...');

  try {
    // Close server connections
    if (server) {
      logger.logSystemInfo('Closing server connections...');
      await new Promise((resolve) => {
        server.close(() => {
          logger.logSystemInfo('Server connections closed.');
          resolve();
        });
      });
    } else {
      logger.logSystemInfo('No active server instance to close.');
    }

    // Close database pool
    logger.logSystemInfo('Closing database pool...');
    await closePool();

    // Remove signal handlers
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    
    logger.logSystemInfo('Database pool closed.');
  } catch (error) {
    logger.logSystemException(error, 'Error during cleanup logic', {
      context: 'on-exit',
    });
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
    logger.logSystemInfo('Initiating exit process...');

    // Set a timeout for the cleanup process
    const timeout = setTimeout(() => {
      logger.logSystemFatal('Cleanup exceeded timeout. Forcing exit.', {
        context: 'on-exit',
      });
      process.exit(code);
    }, 10000); // 10-second timeout

    await cleanupLogic();
    clearTimeout(timeout);
    
    logger.logSystemInfo('Cleanup completed successfully.');
  } catch (error) {
    logger.logSystemException(error, 'Unexpected error during exit', {
      context: 'on-exit',
    });
  } finally {
    logger.logSystemInfo(`Exiting with code: ${code}`);
    process.exit(code);
  }
};

module.exports = { handleExit, setServer };
