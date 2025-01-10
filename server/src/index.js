/**
 * @file index.js
 * @description Application entry point.
 */

const { logInfo, logFatal, logDebug } = require('./utils/logger-helper');
const { startServer } = require('./server');
const { loadEnv, validateEnv, loadSecret } = require('./config/env');
const { setServer, handleExit } = require('./utils/on-exit'); // Load and validate environment variables

/**
 * Environment validation groups with dynamic secret loading.
 */
const environmentGroups = {
  general: [
    { envVar: 'PORT', required: true },
    { envVar: 'ALLOWED_ORIGINS', required: true },
    { envVar: 'LOGS_DIR', required: true, defaultValue: '../../../dev_logs' },
    { envVar: 'API_PREFIX', required: true },
  ],
  jwt: [
    { envVar: 'JWT_ACCESS_SECRET', secret: () => loadSecret('server_jwt_access_secret', 'JWT_ACCESS_SECRET'), required: true },
    { envVar: 'JWT_REFRESH_SECRET', secret: () => loadSecret('server_jwt_refresh_secret', 'JWT_REFRESH_SECRET'), required: true },
  ],
  aws: [
    { envVar: 'AWS_REGION', required: true },
    { envVar: 'AWS_ACCESS_KEY_ID', required: true },
    { envVar: 'AWS_SECRET_ACCESS_KEY', required: true },
    { envVar: 'AWS_S3_BUCKET_NAME', required: true },
  ],
  db: [
    { envVar: 'DB_PASSWORD', secret: () => loadSecret('db_password', 'DB_PASSWORD'), required: true },
    { envVar: 'DB_HOST', required: true },
    { envVar: 'DB_USER', required: true },
    { envVar: 'DB_PORT', required: true },
  ],
  rootAdmin: [
    { envVar: 'ROOT_ADMIN_EMAIL', required: true },
    { envVar: 'ROOT_ADMIN_PASSWORD', required: true },
  ],
};

/**
 * Initializes and starts the application.
 */
const initializeApp = async () => {
  try {
    logInfo('Loading environment variables...');
    const { env } = loadEnv();
    
    logInfo('Validating environment variables...');
    validateEnv(environmentGroups);
    
    logInfo(`Environment loaded: ${env}`);
    
    logInfo('Starting server...');
    const serverInstance = await startServer();
    
    logInfo('Signal handlers registered.');
    setServer(serverInstance); // Pass server reference for cleanup
    process.on('SIGINT', () => handleExit(0));
    process.on('SIGTERM', () => handleExit(0));
    
    logInfo('Application started successfully.');
    return serverInstance;
  } catch (error) {
    logFatal(`Application initialization failed: ${error.message}`, null, { stack: error.stack });
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
