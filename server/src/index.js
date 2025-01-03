/**
 * @file index.js
 * @description Application entry point.
 */

require('dotenv').config(); // Load environment variables
const { startServer } = require('./server');

// Start the server
(async () => {
  try {
    await startServer();
  } catch (error) {
    console.error('❌ Error starting server:', error.message);
    process.exit(1); // Exit with failure code
  }
})();
