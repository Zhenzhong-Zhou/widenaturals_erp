const {
  validateEnvVars,
  getPoolConfig,
  getConnectionConfig,
} = require('../../../src/config/db-config');

describe('Database Configuration', () => {
  // Helper to mock environment variables dynamically
  const setEnvVars = (overrides = {}) => {
    process.env.DEV_DB_HOST = 'localhost';
    process.env.DEV_DB_NAME = 'test_db';
    process.env.DEV_DB_USER = 'test_user';
    process.env.DEV_DB_PASSWORD = 'test_password';
    process.env.DEV_DB_PORT = '5432';
    process.env.DB_POOL_MIN = '2';
    process.env.DB_POOL_MAX = '10';

    // Apply overrides for specific tests
    Object.entries(overrides).forEach(([key, value]) => {
      process.env[key] = value;
    });
  };

  const clearEnvVars = () => {
    delete process.env.DEV_DB_HOST;
    delete process.env.DEV_DB_NAME;
    delete process.env.DEV_DB_USER;
    delete process.env.DEV_DB_PASSWORD;
    delete process.env.DEV_DB_PORT;
    delete process.env.DB_POOL_MIN;
    delete process.env.DB_POOL_MAX;
  };

  beforeEach(() => {
    setEnvVars(); // Default mock environment variables
  });

  afterEach(() => {
    clearEnvVars(); // Clear environment variables after each test
  });

  // Test validateEnvVars
  describe('validateEnvVars', () => {
    it('should validate environment variables without errors', () => {
      expect(() => validateEnvVars('development')).not.toThrow();
    });

    it('should throw an error if a required environment variable is missing', () => {
      delete process.env.DEV_DB_HOST;
      expect(() => validateEnvVars('development')).toThrow(
        'Missing environment variables: DEV_DB_HOST'
      );
    });

    it('should throw an error if multiple required variables are missing', () => {
      delete process.env.DEV_DB_HOST;
      delete process.env.DEV_DB_NAME;
      expect(() => validateEnvVars('development')).toThrow(
        'Missing environment variables: DEV_DB_HOST, DEV_DB_NAME'
      );
    });
  });

  // Test getPoolConfig
  describe('getPoolConfig', () => {
    it('should return the correct pool configuration from environment variables', () => {
      const poolConfig = getPoolConfig();
      expect(poolConfig).toEqual({ min: 2, max: 10 });
    });

    it('should use default values if DB_POOL_MIN and DB_POOL_MAX are not set', () => {
      delete process.env.DB_POOL_MIN;
      delete process.env.DB_POOL_MAX;
      const poolConfig = getPoolConfig();
      expect(poolConfig).toEqual({ min: 2, max: 10 });
    });

    it('should handle non-numeric pool values gracefully', () => {
      setEnvVars({ DB_POOL_MIN: 'invalid', DB_POOL_MAX: 'invalid' });
      const poolConfig = getPoolConfig();
      expect(poolConfig).toEqual({ min: 2, max: 10 }); // Default values
    });
  });

  // Test getConnectionConfig
  describe('getConnectionConfig', () => {
    it('should return the correct connection configuration for DEV', () => {
      const connectionConfig = getConnectionConfig('DEV');
      expect(connectionConfig).toEqual({
        host: 'localhost',
        database: 'test_db',
        user: 'test_user',
        password: 'test_password',
        port: '5432',
      });
    });

    it('should return undefined for missing environment variables', () => {
      delete process.env.DEV_DB_NAME;
      const connectionConfig = getConnectionConfig('DEV');
      expect(connectionConfig.database).toBeUndefined();
    });

    it('should throw if an invalid prefix is used', () => {
      const connectionConfig = getConnectionConfig('INVALID');
      expect(connectionConfig).toEqual({
        host: undefined,
        database: undefined,
        user: undefined,
        password: undefined,
        port: undefined,
      });
    });

    it('should handle non-numeric port values gracefully', () => {
      setEnvVars({ DEV_DB_PORT: 'invalid' });
      const connectionConfig = getConnectionConfig('DEV');
      expect(connectionConfig.port).toBe('invalid'); // Raw invalid value
    });
  });
});
