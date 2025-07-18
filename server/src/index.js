/**
 * @file index.js
 * @description Application entry point.
 */

const {
  logSystemInfo,
  logSystemError,
  logSystemCrash,
} = require('./utils/system-logger');
const { startServer, shutdownServer } = require('./server');
const { setServer, handleExit } = require('./utils/on-exit');
const { loadAndValidateEnv } = require('./config/env-manager'); // Load and validate environment variables

/**
 * Initializes and starts the application.
 */
const initializeApp = async () => {
  try {
    logSystemInfo('Loading environment variables...');

    // Load and validate environment variables
    const { env } = loadAndValidateEnv();
    logSystemInfo(
      `Environment variables loaded and validated for environment: ${env}`
    );

    logSystemInfo('Starting server...');
    const serverInstance = await startServer();

    logSystemInfo('Signal handlers registered.');
    setServer(serverInstance); // Pass server reference for cleanup

    // Register signal handlers for graceful shutdown
    process.on('SIGINT', async () => {
      logSystemInfo('SIGINT received. Shutting down gracefully...');
      await handleShutdown(0);
    });
    process.on('SIGTERM', async () => {
      logSystemInfo('SIGTERM received. Shutting down gracefully...');
      await handleShutdown(0);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logSystemError('Unhandled Rejection occurred', {
        reason,
        promise,
      });
    });

    process.on('uncaughtException', (err) => {
      logSystemError('Uncaught Exception occurred', {
        error: err,
        timestamp: new Date().toISOString(),
        pid: process.pid,
        traceId: 'uncaught-exception',
      });
      process.exit(1);
    });

    logSystemInfo('Application started successfully.');
    return serverInstance;
  } catch (error) {
    logSystemCrash(error, 'Application initialization failed', {
      context: 'bootstrap',
      severity: 'critical',
    });
    await handleExit(1);
  }
};

/**
 * Handles the application's graceful shutdown.
 * @param {number} exitCode - The exit code to terminate the process with.
 */
const handleShutdown = async (exitCode) => {
  try {
    logSystemInfo('Initiating application shutdown...');

    // Perform server-specific cleanup
    await shutdownServer(); // Call server-specific shutdown logic

    logSystemInfo('Application shutdown completed.');
    process.exit(0);
  } catch (error) {
    logSystemCrash(error, 'Error during shutdown', {
      context: 'shutdown',
    });
    await handleExit(1);
  }
};

// Execute if file is called directly
if (require.main === module) {
  initializeApp().catch(async (error) => {
    logSystemCrash(error, 'Startup failed', {
      context: 'entry',
    });
    await handleExit(1);
  });
}

module.exports = { initializeApp };
