const path = require('path');

// Mock external dependencies
jest.mock('../../../src/config/env', () => ({
  loadEnv: jest.fn(() => process.env.NODE_ENV || 'development'),
  getEnvPrefix: jest.fn((env) => {
    const prefixes = {
      development: 'DEV',
      test: 'TEST',
      staging: 'STAGING',
      production: 'PROD',
    };
    return prefixes[env] || env.toUpperCase();
  }),
}));
jest.mock('../../../src/config/db-config', () => ({
  validateEnvVars: jest.fn(() => true),
  getPoolConfig: jest.fn(() => ({ min: 2, max: 10 })),
  getConnectionConfig: jest.fn((prefix) => ({
    host: `localhost_${prefix}`,
    database: `db_${prefix}`,
    user: `user_${prefix}`,
    password: `password_${prefix}`,
    port: '5432',
  })),
}));

const knexfile = require('../../../knexfile');
const { getEnvPrefix } = require('../../../src/config/env');

describe('Knex Configuration', () => {
  const environments = ['development', 'test', 'staging', 'production'];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  environments.forEach((env) => {
    test(`builds correct configuration for ${env} environment`, () => {
      process.env.NODE_ENV = env;

      const prefix = getEnvPrefix(env);
      const config = knexfile[env];

      const expectedConnection = {
        host: `localhost_${prefix}`,
        database: `db_${prefix}`,
        user: `user_${prefix}`,
        password: `password_${prefix}`,
        port: '5432',
      };

      expect(config.connection).toEqual(expectedConnection);
      expect(config.pool).toEqual({ min: 2, max: 10 });
      expect(config.migrations.directory).toBe(
        path.resolve(__dirname, '../../../src/database/migrations')
      );
      expect(config.seeds.directory).toBe(
        path.resolve(__dirname, `../../../src/database/seeds/${env}`)
      );
      expect(config.migrations.tableName).toBe('knex_migrations');
    });
  });
});
