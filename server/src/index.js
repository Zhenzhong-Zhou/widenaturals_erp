/**
 * @file index.js
 * @description Application entry point.
 */

const { logFatal, logInfo } = require('./utils/loggerHelper');
const { startServer } = require('./server');
const { loadEnv } = require('./config/env'); // Load and validate environment variables

// Load environment variables once
const env = loadEnv(); // Logs warnings if `.env` files are missing

// Start the server
(async () => {
  try {
    logInfo(`Starting application in ${env} mode...`);
    await startServer();
  } catch (error) {
    logFatal(`Server startup failed: ${error.message}`);
    process.exit(1); // Exit with failure code
  }
})();
