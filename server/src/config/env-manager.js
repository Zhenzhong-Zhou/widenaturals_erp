/**
 * @file env-manager.js
 * @description Bootstrap orchestrator for environment loading and validation.
 *
 * Responsibilities:
 * - Load environment variables from layered dotenv files
 * - Resolve secret-backed configuration through env utilities
 * - Validate required startup configuration across grouped domains
 * - Fail fast on invalid or missing environment configuration
 *
 * Context:
 * - Runs during system/bootstrap phase
 * - Executes outside the request lifecycle
 *
 * Design:
 * - Delegates low-level env resolution to env.js
 * - Centralizes environment group definitions for startup validation
 * - Uses system logger and AppError-aligned failure handling
 */

const {
  logSystemCrash,
  logSystemInfo,
} = require('../utils/logging/system-logger');
const { loadEnv, validateEnv, loadSecret } = require('./env');

const ENV_CONTEXT = 'env-loader';

/**
 * Loads dotenv files and validates all required environment configuration.
 *
 * Behavior:
 * - Loads environment-specific dotenv files based on NODE_ENV
 * - Validates grouped runtime, security, database, and infrastructure config
 * - Throws on invalid or missing bootstrap-critical configuration
 *
 * Failure Strategy:
 * - Any configuration failure is treated as startup-critical
 * - Logs a single authoritative crash entry, then rethrows
 *
 * @returns {{ env: string }} Normalized runtime environment metadata.
 * @throws {AppError} When required configuration is missing or invalid.
 */
const loadAndValidateEnv = () => {
  try {
    const env = loadEnv();
    
    const environmentGroups = {
      general: [
        { envVar: 'NODE_ENV', required: true },
        { envVar: 'PORT', required: true },
        { envVar: 'LOGS_DIR', required: true },
        { envVar: 'LOG_LEVEL', required: true },
        { envVar: 'PASSWORD_PEPPER', required: true },
      ],
      
      jwt: [
        {
          envVar: 'JWT_ACCESS_SECRET',
          secret: () =>
            loadSecret('server_jwt_access_secret', 'JWT_ACCESS_SECRET'),
          required: true,
        },
        {
          envVar: 'JWT_REFRESH_SECRET',
          secret: () =>
            loadSecret('server_jwt_refresh_secret', 'JWT_REFRESH_SECRET'),
          required: true,
        },
        {
          envVar: 'ACCESS_TOKEN_TTL_SECONDS',
          required: true,
          validate: (v) => Number.isInteger(+v) && +v > 0,
        },
        {
          envVar: 'REFRESH_TOKEN_TTL_SECONDS',
          required: true,
          validate: (v) => Number.isInteger(+v) && +v > 0,
        },
      ],
      
      db: [
        { envVar: 'DB_HOST',     required: true },
        { envVar: 'DB_PORT',     required: true,  validate: (v) => Number.isInteger(+v) && +v > 0 },
        { envVar: 'DB_NAME',     required: true },
        { envVar: 'DB_USER',     required: true },
        {
          envVar:  'DB_PASSWORD',
          secret:  () => loadSecret('db_password', 'DB_PASSWORD'),
          required: true,
        },
        { envVar: 'REQUIRED_PG_VERSION', required: true,  validate: (v) => Number.isInteger(+v) && +v > 0 },
        { envVar: 'DB_APP_NAME',         required: false },
        { envVar: 'DB_POOL_MAX',         required: false, validate: (v) => Number.isInteger(+v) && +v > 0 },
        { envVar: 'DB_IDLE_TIMEOUT',     required: false, validate: (v) => Number.isInteger(+v) && +v >= 0 },
        { envVar: 'DB_CONN_TIMEOUT',     required: false, validate: (v) => Number.isInteger(+v) && +v >= 0 },
      ],
      
      monitoring: [
        { envVar: 'POOL_MONITOR_INTERVAL', required: false, validate: (v) => Number.isInteger(+v) && +v >= 0 },
        { envVar: 'SLOW_QUERY_THRESHOLD',  required: false, validate: (v) => Number.isInteger(+v) && +v >= 0 },
      ],
      
      backup: [
        { envVar: 'USE_CRON_BACKUP', required: false, default: 'false' },
        { envVar: 'BACKUP_DIR',      required: false },
        { envVar: 'MAX_BACKUPS',     required: false, validate: (v) => Number.isInteger(+v) && +v > 0 },
        {
          envVar:  'BACKUP_ENCRYPTION_KEY',
          secret:  () => loadSecret('backup_encryption_key', 'BACKUP_ENCRYPTION_KEY'),
          required: true,
        },
      ],
      
      rootAdmin: [
        { envVar: 'ROOT_ADMIN_EMAIL', required: true },
        {
          envVar: 'ROOT_ADMIN_PASSWORD',
          secret: () =>
            loadSecret('root_admin_password', 'ROOT_ADMIN_PASSWORD'),
          required: true,
        },
      ],
      
      aws: [
        { envVar: 'AWS_REGION', required: true },
        { envVar: 'AWS_ACCESS_KEY_ID', required: true },
        {
          envVar: 'AWS_SECRET_ACCESS_KEY',
          secret: () =>
            loadSecret('aws_secret_access_key', 'AWS_SECRET_ACCESS_KEY'),
          required: true,
        },
        { envVar: 'AWS_S3_BUCKET_NAME', required: true },
      ],
      
      cors: [
        { envVar: 'ALLOWED_ORIGINS', required: true },
        { envVar: 'ALLOWED_HEADERS', required: true },
        { envVar: 'ALLOWED_METHODS', required: true },
        { envVar: 'ALLOW_CREDENTIALS', required: true },
        { envVar: 'OPTIONS_SUCCESS_STATUS', required: true },
      ],
      
      media: [
        {
          envVar: 'ALLOWED_IMAGE_HOSTS',
          required: true,
          validate: (v) =>
            typeof v === 'string' &&
            v.split(',').map((h) => h.trim()).filter(Boolean).length > 0,
        },
      ],
      
      csrf: [
        { envVar: 'CSRF_TESTING', required: false },
        { envVar: 'COOKIE_SECURE', required: true },
        { envVar: 'COOKIE_SAMESITE', required: true },
      ],
      
      rateLimit: [
        { envVar: 'RATE_LIMIT_WINDOW_MS', required: false },
        { envVar: 'RATE_LIMIT_MAX', required: false },
      ],
    };
    
    validateEnv(environmentGroups);
    
    logSystemInfo('Environment loading completed successfully', {
      context: ENV_CONTEXT,
      env: env.env,
    });
    
    return env;
  } catch (error) {
    // Bootstrap configuration failures are non-recoverable.
    // Log once at crash severity, then rethrow to stop startup.
    logSystemCrash(error, 'Environment validation failed', {
      context: ENV_CONTEXT,
    });
    
    throw error;
  }
};

module.exports = {
  loadAndValidateEnv,
};
