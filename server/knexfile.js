// Update with your config settings.
require('dotenv').config(); // Load environment variables from .env

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'postgresql', // Use PostgreSQL for local development
    connection: {
      host: process.env.DEV_DB_HOST || '127.0.0.1', // Default to localhost
      database: process.env.DEV_DB_NAME || 'my_dev_db', // Replace with your database name
      user: process.env.DEV_DB_USER || 'postgres', // Replace with your username
      password: process.env.DEV_DB_PASSWORD || 'password', // Replace with your password
      port: process.env.DEV_DB_PORT || 5432, // Default PostgreSQL port
    },
    pool: {
      min: 2,
      max: 10, // Adjust connection pooling as needed
    },
    migrations: {
      directory: './src/database/migrations', // Directory for migration files
    },
    seeds: {
      directory: './src/database/seeds', // Directory for seed files
    },
  },
  
  test: {
    client: 'postgresql',
    connection: {
      host: process.env.TEST_DB_HOST || '127.0.0.1',
      database: process.env.TEST_DB_NAME || 'test_db',
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'testpassword',
      port: process.env.TEST_DB_PORT || 5432,
    },
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations_test',
    },
    seeds: {
      directory: './db/seeds/test',
    },
  },
  
  staging: {
    client: 'postgresql', // PostgreSQL for staging environment
    connection: {
      host: process.env.STAGING_DB_HOST || '127.0.0.1',
      database: process.env.STAGING_DB_NAME || 'staging_db',
      user: process.env.STAGING_DB_USER || 'staging_user',
      password: process.env.STAGING_DB_PASSWORD || 'staging_password',
      port: process.env.STAGING_DB_PORT || 5432,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations', // Ensure consistent migration tracking
    },
    seeds: {
      directory: './db/seeds',
    },
  },
  
  production: {
    client: 'postgresql', // PostgreSQL for production
    connection: {
      host: process.env.PROD_DB_HOST || '127.0.0.1',
      database: process.env.PROD_DB_NAME || 'prod_db',
      user: process.env.PROD_DB_USER || 'prod_user',
      password: process.env.PROD_DB_PASSWORD || 'prod_password',
      port: process.env.PROD_DB_PORT || 5432,
    },
    pool: {
      min: 5, // Higher pooling for production workloads
      max: 20,
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './db/seeds',
    },
  },
};
