const path = require('path');

// Load NODE_ENV and default to 'development'
const env = process.env.NODE_ENV?.trim().toLowerCase() || 'development';

// Load environment-specific variables
require('dotenv').config({ path: path.resolve(__dirname, `../env/${env}/.env.server`) });
require('dotenv').config({ path: path.resolve(__dirname, `../env/${env}/.env.database`)});

// Allowed environments
const allowedEnvs = ['development', 'test', 'staging', 'production'];
if (!allowedEnvs.includes(env)) {
  throw new Error(`Invalid NODE_ENV value: ${env}. Allowed values: ${allowedEnvs.join(', ')}`);
}

// Map environment to prefixes
const getEnvPrefix = (env) => {
  const envMapping = {
    development: 'DEV',
    test: 'TEST',
    staging: 'STAGING',
    production: 'PROD',
  };
  return envMapping[env] || 'UNKNOWN';
};
const envPrefix = getEnvPrefix(env);

// Validate required variables
const validateEnvVars = () => {
  const requiredVars = [
    `${envPrefix}_DB_HOST`,
    `${envPrefix}_DB_NAME`,
    `${envPrefix}_DB_USER`,
    `${envPrefix}_DB_PASSWORD`,
    `${envPrefix}_DB_PORT`,
  ];
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
};
validateEnvVars();

// Pool configuration
const poolConfig = {
  min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
};

// Debug logging
if (env !== 'production') {
  console.log(`Environment: ${env}`);
  console.log(`Database Host: ${process.env[`${envPrefix}_DB_HOST`]}`);
  console.log(`Database Name: ${process.env[`${envPrefix}_DB_NAME`]}`);
  console.log(`Database User: ${process.env[`${envPrefix}_DB_USER`]}`);
  console.log(`Pool Min: ${poolConfig.min}, Max: ${poolConfig.max}`);
}

// Base Knex configuration
const baseConfig = {
  client: 'postgresql',
  pool: poolConfig,
  migrations: {
    directory: path.resolve(__dirname, './src/database/migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.resolve(__dirname, './src/database/seeds'),
  },
};

// Connection configurations
const getConnectionConfig = (prefix) => ({
  host: process.env[`${prefix}_DB_HOST`],
  database: process.env[`${prefix}_DB_NAME`],
  user: process.env[`${prefix}_DB_USER`],
  password: process.env[`${prefix}_DB_PASSWORD`],
  port: process.env[`${prefix}_DB_PORT`],
});

// Export Knex configurations
module.exports = {
  development: { ...baseConfig, connection: getConnectionConfig('DEV') },
  test: { ...baseConfig, connection: getConnectionConfig('TEST') },
  staging: { ...baseConfig, connection: getConnectionConfig('STAGING') },
  production: { ...baseConfig, connection: getConnectionConfig('PROD') },
};
