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
      general: [
        { envVar: 'NODE_ENV', required: true },
        { envVar: 'PORT', required: true },
        {
          envVar: 'LOGS_DIR',
          required: true,
          defaultValue: '../../../dev_logs',
        },
        { envVar: 'LOG_LEVEL', required: true, defaultValue: 'debug' },
        { envVar: 'POOL_MONITOR_INTERVAL', required: false },
        { envVar: 'SLOW_QUERY_THRESHOLD', required: false },
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
      ],
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
        { envVar: 'BACKUP_DIR', required: false },
        { envVar: 'PG_DUMP_PATH', required: false },
        { envVar: 'MAX_BACKUPS', required: false },
        { envVar: 'BACKUP_ENCRYPTION_KEY', required: false },
      ],
      rootAdmin: [
        { envVar: 'ROOT_ADMIN_EMAIL', required: true },
        { envVar: 'ROOT_ADMIN_PASSWORD', required: true },
      ],
      aws: [
        { envVar: 'AWS_REGION', required: true },
        { envVar: 'AWS_ACCESS_KEY_ID', required: true },
        { envVar: 'AWS_SECRET_ACCESS_KEY', required: true },
        { envVar: 'AWS_S3_BUCKET_NAME', required: true },
      ],
      cors: [
        { envVar: 'ALLOWED_ORIGINS', required: true },
        { envVar: 'ALLOWED_HEADERS', required: true },
        { envVar: 'ALLOWED_METHODS', required: true },
        { envVar: 'ALLOW_CREDENTIALS', required: true },
        { envVar: 'OPTIONS_SUCCESS_STATUS', required: true },
      ],
      csrf: [
        { envVar: 'CSRF_TESTING', required: false },
        { envVar: 'COOKIE_SECURE', required: true },
        { envVar: 'COOKIE_SAMESITE', required: true },
        { envVar: 'CSRF_COOKIE_MAXAGE', required: false },
      ],
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
