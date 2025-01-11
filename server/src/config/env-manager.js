/**
 * @file env-manager.js
 * @description Handles loading and validating environment variables.
 */

const { logFatal } = require('../utils/logger-helper');
const { loadEnv, validateEnv, loadSecret } = require('./env');

const loadAndValidateEnv = () => {
  try {
    const env = loadEnv();

    const environmentGroups = {
      general: [
        { envVar: 'PORT', required: true },
        { envVar: 'ALLOWED_ORIGINS', required: true },
        {
          envVar: 'LOGS_DIR',
          required: true,
          defaultValue: '../../../dev_logs',
        },
        { envVar: 'API_PREFIX', required: true },
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
      aws: [
        { envVar: 'AWS_REGION', required: true },
        { envVar: 'AWS_ACCESS_KEY_ID', required: true },
        { envVar: 'AWS_SECRET_ACCESS_KEY', required: true },
        { envVar: 'AWS_S3_BUCKET_NAME', required: true },
      ],
      db: [
        {
          envVar: 'DB_PASSWORD',
          secret: () => loadSecret('db_password', 'DB_PASSWORD'),
          required: true,
        },
        { envVar: 'DB_HOST', required: true },
        { envVar: 'DB_USER', required: true },
        { envVar: 'DB_PORT', required: true },
      ],
      rootAdmin: [
        { envVar: 'ROOT_ADMIN_EMAIL', required: true },
        { envVar: 'ROOT_ADMIN_PASSWORD', required: true },
      ],
    };

    validateEnv(environmentGroups);
    return env;
  } catch (error) {
    logFatal(`Environment validation failed: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
};

module.exports = { loadAndValidateEnv };
