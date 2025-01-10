/**
 * @file index.js
 * @description Application entry point.
 */

const { logInfo, logFatal, logDebug } = require('./utils/logger-helper');
const { startServer } = require('./server');
const { loadEnv, validateEnv } = require('./config/env');
const { setServer, handleExit } = require('./utils/on-exit'); // Load and validate environment variables

// Load environment variables once
const { env, dbPassword, jwtAccessSecret, jwtRefreshSecret } = loadEnv(); // Logs warnings if `.env` files are missing

// Validate required environment variables and secrets
validateEnv([
  { envVar: 'PORT', secret: null, required: true },
  { envVar: 'ALLOWED_ORIGINS', secret: null, required: true },
  { envVar: 'LOGS_DIR', secret: null, required: true, defaultValue: './logs' },
  { envVar: 'JWT_ACCESS_SECRET', secret: jwtAccessSecret, required: true },
  { envVar: 'JWT_REFRESH_SECRET', secret: jwtRefreshSecret, required: true },
  { envVar: 'AWS_REGION', secret: null, required: true },
  { envVar: 'AWS_ACCESS_KEY_ID', secret: null, required: true },
  { envVar: 'AWS_SECRET_ACCESS_KEY', secret: null, required: true },
  { envVar: 'AWS_S3_BUCKET_NAME', secret: null, required: true },
  { envVar: 'DB_PASSWORD', secret: dbPassword, required: true, },
  { envVar: 'DB_HOST', secret: null, required: true },
  { envVar: 'DB_USER', secret: null, required: true },
  { envVar: 'DB_PORT', secret: null, required: true },
  { envVar: 'API_PREFIX', secret: null, required: true },
  { envVar: 'ROOT_ADMIN_EMAIL', secret: null, required: true },
  { envVar: 'ROOT_ADMIN_PASSWORD', secret: null, required: true },
]);

// Start the server
(async () => {
  try {
    logInfo('Starting application...');
    const serverInstance = await startServer();
    setServer(serverInstance);
    
    // Register signal handlers
    process.on('SIGINT', () => handleExit(0));
    process.on('SIGTERM', () => handleExit(0));
  } catch (error) {
    logFatal(`Startup failed: ${error.message}`);
    await handleExit(1); // Trigger cleanup on startup failure
  }
})();
