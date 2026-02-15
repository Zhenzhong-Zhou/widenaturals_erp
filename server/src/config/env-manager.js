/**
 * @file env-manager.js
 * @description Handles loading and validating environment variables.
 */

const { logSystemFatal } = require('../utils/system-logger');
const { loadEnv, validateEnv, loadSecret } = require('./env');

const loadAndValidateEnv = () => {
  try {
    const env = loadEnv();

    const environmentGroups = {
      // --------------------------------------------------
      // General runtime
      // --------------------------------------------------
      general: [
        { envVar: 'NODE_ENV', required: true },
        { envVar: 'PORT', required: true },
        { envVar: 'LOGS_DIR', required: true },
        { envVar: 'LOG_LEVEL', required: true },
        { envVar: 'PASSWORD_PEPPER', required: true },
      ],

      // --------------------------------------------------
      // JWT / Token configuration
      // --------------------------------------------------
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

        // Token lifetimes (seconds)
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

      // --------------------------------------------------
      // Database
      // --------------------------------------------------
      db: [
        { envVar: 'DB_HOST', required: true },
        { envVar: 'DB_PORT', required: true },
        { envVar: 'DB_NAME', required: true },
        { envVar: 'DB_USER', required: true },
        {
          envVar: 'DB_PASSWORD',
          secret: () => loadSecret('db_password', 'DB_PASSWORD'),
          required: true,
        },

        // Tooling
        { envVar: 'PG_DUMP_PATH', required: false },

        // Backup
        { envVar: 'BACKUP_DIR', required: false },
        { envVar: 'MAX_BACKUPS', required: false },
        {
          envVar: 'BACKUP_ENCRYPTION_KEY',
          secret: () =>
            loadSecret('backup_encryption_key', 'BACKUP_ENCRYPTION_KEY'),
          required: true,
        },

        // Monitoring
        { envVar: 'POOL_MONITOR_INTERVAL', required: false },
        { envVar: 'SLOW_QUERY_THRESHOLD', required: false },
      ],

      // --------------------------------------------------
      // Root admin bootstrap
      // --------------------------------------------------
      rootAdmin: [
        { envVar: 'ROOT_ADMIN_EMAIL', required: true },
        {
          envVar: 'ROOT_ADMIN_PASSWORD',
          secret: () =>
            loadSecret('root_admin_password', 'ROOT_ADMIN_PASSWORD'),
          required: true,
        },
      ],

      // --------------------------------------------------
      // AWS
      // --------------------------------------------------
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

      // --------------------------------------------------
      // CORS
      // --------------------------------------------------
      cors: [
        { envVar: 'ALLOWED_ORIGINS', required: true },
        { envVar: 'ALLOWED_HEADERS', required: true },
        { envVar: 'ALLOWED_METHODS', required: true },
        { envVar: 'ALLOW_CREDENTIALS', required: true },
        { envVar: 'OPTIONS_SUCCESS_STATUS', required: true },
      ],

      // --------------------------------------------------
      // CSRF
      // --------------------------------------------------
      csrf: [
        { envVar: 'CSRF_TESTING', required: false },
        { envVar: 'COOKIE_SECURE', required: true },
        { envVar: 'COOKIE_SAMESITE', required: true },
      ],

      // --------------------------------------------------
      // Rate limiting
      // --------------------------------------------------
      rateLimit: [
        { envVar: 'RATE_LIMIT_WINDOW_MS', required: false },
        { envVar: 'RATE_LIMIT_MAX', required: false },
      ],
    };

    validateEnv(environmentGroups);
    return env;
  } catch (error) {
    logSystemFatal('Environment validation failed', {
      errorMessage: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      context: 'env-loader',
      severity: 'critical',
    });

    throw error;
  }
};

module.exports = { loadAndValidateEnv };
