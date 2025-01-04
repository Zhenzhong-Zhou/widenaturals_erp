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
  { envVar: 'LOGS_DIR', secret: null, required: true, defaultValue: './logs' },
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
  
  // Rate Limiter - Global
  { envVar: 'RATE_LIMIT_GLOBAL_WINDOW_MS', secret: null, required: true },
  { envVar: 'RATE_LIMIT_GLOBAL_MAX', secret: null, required: true },
  { envVar: 'RATE_LIMIT_GLOBAL_MESSAGE', secret: null, required: true },
  
  // Rate Limiter - API
  { envVar: 'RATE_LIMIT_API_WINDOW_MS', secret: null, required: true },
  { envVar: 'RATE_LIMIT_API_MAX', secret: null, required: true },
  { envVar: 'RATE_LIMIT_API_MESSAGE', secret: null, required: true },
  
  // Rate Limiter - Login
  { envVar: 'RATE_LIMIT_LOGIN_WINDOW_MS', secret: null, required: true },
  { envVar: 'RATE_LIMIT_LOGIN_MAX', secret: null, required: true },
  { envVar: 'RATE_LIMIT_LOGIN_MESSAGE', secret: null, required: true },
  
  // Rate Limiter - Authorization
  { envVar: 'RATE_LIMIT_AUTHORIZATION_WINDOW_MS', secret: null, required: true },
  { envVar: 'RATE_LIMIT_AUTHORIZATION_MAX', secret: null, required: true },
  { envVar: 'RATE_LIMIT_AUTHORIZATION_MESSAGE', secret: null, required: true },
  
  // Rate Limiter - Authentication
  { envVar: 'RATE_LIMIT_AUTHENTICATION_WINDOW_MS', secret: null, required: true },
  { envVar: 'RATE_LIMIT_AUTHENTICATION_MAX', secret: null, required: true },
  { envVar: 'RATE_LIMIT_AUTHENTICATION_MESSAGE', secret: null, required: true },
  
  // Rate Limiter - Password Reset
  { envVar: 'RATE_LIMIT_PASSWORD_RESET_WINDOW_MS', secret: null, required: true },
  { envVar: 'RATE_LIMIT_PASSWORD_RESET_MAX', secret: null, required: true },
  { envVar: 'RATE_LIMIT_PASSWORD_RESET_MESSAGE', secret: null, required: true },
  
  // Rate Limiter - Signup
  { envVar: 'RATE_LIMIT_SIGNUP_WINDOW_MS', secret: null, required: true },
  { envVar: 'RATE_LIMIT_SIGNUP_MAX', secret: null, required: true },
  { envVar: 'RATE_LIMIT_SIGNUP_MESSAGE', secret: null, required: true },
  
  // Rate Limiter - Admin
  { envVar: 'RATE_LIMIT_ADMIN_WINDOW_MS', secret: null, required: true },
  { envVar: 'RATE_LIMIT_ADMIN_MAX', secret: null, required: true },
  { envVar: 'RATE_LIMIT_ADMIN_MESSAGE', secret: null, required: true },
  
  // Rate Limiter - File Upload
  { envVar: 'RATE_LIMIT_FILE_UPLOAD_WINDOW_MS', secret: null, required: true },
  { envVar: 'RATE_LIMIT_FILE_UPLOAD_MAX', secret: null, required: true },
  { envVar: 'RATE_LIMIT_FILE_UPLOAD_MESSAGE', secret: null, required: true },
  
  // Rate Limiter - Forgot Username
  { envVar: 'RATE_LIMIT_FORGOT_USERNAME_WINDOW_MS', secret: null, required: true },
  { envVar: 'RATE_LIMIT_FORGOT_USERNAME_MAX', secret: null, required: true },
  { envVar: 'RATE_LIMIT_FORGOT_USERNAME_MESSAGE', secret: null, required: true },
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
