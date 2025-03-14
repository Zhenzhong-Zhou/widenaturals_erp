/**
 * @file index.js
 * @description Application entry point.
 */

const { logInfo, logFatal, logError } = require('./utils/logger-helper');
const { startServer, shutdownServer } = require('./server');
const { setServer, handleExit } = require('./utils/on-exit');
const { loadAndValidateEnv } = require('./config/env-manager'); // Load and validate environment variables

/**
 * Initializes and starts the application.
 */
const initializeApp = async () => {
  try {
    logInfo('Loading environment variables...');

    // Load and validate environment variables
    const { env } = loadAndValidateEnv();
    logInfo(
      `Environment variables loaded and validated for environment: ${env}`
    );

    logInfo('Starting server...');
    const serverInstance = await startServer();

    logInfo('Signal handlers registered.');
    setServer(serverInstance); // Pass server reference for cleanup

    // Register signal handlers for graceful shutdown
    process.on('SIGINT', async () => {
      logInfo('SIGINT received. Shutting down gracefully...');
      await handleShutdown(0);
    });
    process.on('SIGTERM', async () => {
      logInfo('SIGTERM received. Shutting down gracefully...');
      await handleShutdown(0);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logError('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    logInfo('Application started successfully.');
    return serverInstance;
  } catch (error) {
    logFatal(`Application initialization failed: ${error.message}`, null, {
      stack: error.stack,
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
    logInfo('Initiating application shutdown...');

    // Perform server-specific cleanup
    await shutdownServer(); // Call server-specific shutdown logic

    logInfo('Application shutdown completed.');
    process.exit(0);
  } catch (error) {
    logFatal(`Error during shutdown: ${error.message}`, { stack: error.stack });
    await handleExit(1);
  }
};

// Execute if file is called directly
if (require.main === module) {
  initializeApp().catch(async (error) => {
    logFatal(`Startup failed: ${error.message}`, null, { stack: error.stack });
    await handleExit(1);
  });
}

module.exports = { initializeApp };
