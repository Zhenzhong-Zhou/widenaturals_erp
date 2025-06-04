/**
 * @file on-exit.js
 * @description Utility function to handle process exits with centralized logic.
 */
const { closePool } = require('../database/db');
const {
  logSystemInfo,
  logSystemException,
  logSystemFatal,
  logSystemWarn
} = require('./system-logger');

let server; // Server reference
let cleanupCalled = false;


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
    logSystemWarn(
      'Cleanup already in progress. Skipping redundant call.'
    );
    return;
  }
  cleanupCalled = true;
  
  logSystemInfo('Starting cleanup logic...');

  try {
    // Close server connections
    if (server) {
      logSystemInfo('Closing server connections...');
      await new Promise((resolve) => {
        server.close(() => {
          logSystemInfo('Server connections closed.');
          resolve();
        });
      });
    } else {
      logSystemInfo('No active server instance to close.');
    }

    // Close database pool
    logSystemInfo('Closing database pool...');
    await closePool();

    // Remove signal handlers
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    
    logSystemInfo('Database pool closed.');
  } catch (error) {
    logSystemException(error, 'Error during cleanup logic', {
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
  try {
    logSystemInfo('Initiating exit process...');

    // Set a timeout for the cleanup process
    const timeout = setTimeout(() => {
     logSystemFatal('Cleanup exceeded timeout. Forcing exit.', {
        context: 'on-exit',
      });
      process.exit(code);
    }, 10000); // 10-second timeout

    await cleanupLogic();
    clearTimeout(timeout);
    
    logSystemInfo('Cleanup completed successfully.');
  } catch (error) {
    logSystemException(error, 'Unexpected error during exit', {
      context: 'on-exit',
    });
  } finally {
    logSystemInfo(`Exiting with code: ${code}`);
    process.exit(code);
  }
};

module.exports = { handleExit, setServer };
