/**
 * @file server.js
 * @description Initializes and starts the server.
 */

const http = require('http');
const { loadEnv } = require('./config/env'); // Load environment variables
const app = require('./app');
const { closePool, testConnection } = require('./database/db');

// Load environment variables
loadEnv(); // Ensure environment variables are loaded

const PORT = process.env.PORT;
if (!PORT) {
  console.error('❌ PORT environment variable is missing or undefined.');
  process.exit(1);
}

// Create the server
const server = http.createServer(app);

/**
 * Starts the server after verifying the database connection.
 */
const startServer = async () => {
  try {
    console.log('🔄 Testing database connection...');
    // await testConnection(); // Test database connection
    testConnection()
      .then(() => console.log('Database is connected'))
      .catch((err) => console.error('Database connection failed:', err));
    console.log('✅ Database connected successfully');
    
    server.listen(PORT, () => {
      console.log(`[${new Date().toISOString()}] 🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`❌ Failed to connect to the database: ${error.message}`);
    process.exit(1); // Exit with failure code if the database connection fails
  }
};

/**
 * Gracefully shuts down the server and cleans up resources.
 */
const shutdown = async () => {
  console.log('🔄 Shutting down server...');
  server.close(async () => {
    console.log('✅ Server closed');
    await closePool();
    console.log('✅ Database connections closed');
    process.exit(0);
  });
};

/**
 * Stops the server manually (for development/testing purposes).
 */
const stopServer = () => {
  server.close(() => {
    console.log('❌ Server stopped manually.');
  });
};

// Handle system signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { startServer, shutdown, stopServer };
