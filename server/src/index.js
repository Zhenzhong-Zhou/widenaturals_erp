/**
 * @file index.js
 * @description Application entry point.
 */

const { logInfo, logFatal } = require('./utils/loggerHelper');
const { startServer } = require('./server');
const { loadEnv, validateEnv, getEnvPrefix } = require('./config/env'); // Load and validate environment variables

// Load environment variables once
const env = loadEnv(); // Logs warnings if `.env` files are missing

// Validate required environment variables and secrets
validateEnv([
  { envVar: 'PORT', secret: null, required: true },
  { envVar: 'ALLOWED_ORIGINS', secret: null, required: true },
  { envVar: 'LOGS_DIR', secret: null, required: true },
  { envVar: 'JWT_SECRET', secret: 'jwt_secret', required: true },
  { envVar: 'AWS_REGION', secret: null, required: true },
  { envVar: 'AWS_ACCESS_KEY_ID', secret: null, required: true },
  { envVar: 'AWS_SECRET_ACCESS_KEY', secret: null, required: true },
  { envVar: 'AWS_S3_BUCKET_NAME', secret: null, required: true },
  { envVar: `${getEnvPrefix(env)}_DB_PASSWORD`, secret: 'db_password', required: true },
  { envVar: `${getEnvPrefix(env)}_DB_HOST`, secret: null, required: true },
  { envVar: `${getEnvPrefix(env)}_DB_USER`, secret: null, required: true },
  { envVar: `${getEnvPrefix(env)}_DB_PORT`, secret: null, required: true },
  { envVar: 'API_PREFIX', secret: null, required: true },
]);

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
