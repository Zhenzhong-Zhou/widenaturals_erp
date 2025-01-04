/**
 * @file index.js
 * @description Application entry point.
 */

require('dotenv').config(); // Load environment variables
const { logFatal } = require('./utils/loggerHelper');
const { startServer } = require('./server');

// Start the server
(async () => {
  try {
    await startServer();
  } catch (error) {
    logFatal(error.message);
    process.exit(1); // Exit with failure code
  }
})();
