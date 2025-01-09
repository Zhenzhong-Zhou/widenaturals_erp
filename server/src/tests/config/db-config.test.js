const {
  validateEnvVars,
  getPoolConfig,
  getConnectionConfig,
} = require('../../../src/config/db-config');

jest.mock('../../../src/config/env', () => ({
  loadEnv: jest.fn(() => ({
    dbPassword: 'test_password', // Mocked password
  })),
}));

describe('Database Configuration', () => {
  // Helper to mock environment variables dynamically
  const setEnvVars = (overrides = {}) => {
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'test_db';
    process.env.DB_USER = 'test_user';
    process.env.DB_PORT = '5432';
    process.env.DB_POOL_MIN = '2';
    process.env.DB_POOL_MAX = '10';
    
    // Apply overrides for specific tests
    Object.entries(overrides).forEach(([key, value]) => {
      process.env[key] = value;
    });
  };
  
  const clearEnvVars = () => {
    delete process.env.DB_HOST;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PORT;
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
      expect(() => validateEnvVars()).not.toThrow();
    });
    
    it('should throw an error if a required environment variable is missing', () => {
      delete process.env.DB_HOST;
      expect(() => validateEnvVars()).toThrow(
        'Missing environment variables: DB_HOST'
      );
    });
    
    it('should throw an error if multiple required variables are missing', () => {
      delete process.env.DB_HOST;
      delete process.env.DB_NAME;
      expect(() => validateEnvVars()).toThrow(
        'Missing environment variables: DB_HOST, DB_NAME'
      );
    });
    
    it.skip('should throw an error if DB_PASSWORD is missing', () => {
      const mockLoadEnv = require('../../../src/config/env').loadEnv;
      mockLoadEnv.mockReturnValueOnce({ dbPassword: null }); // Simulate missing password
      
      expect(() => validateEnvVars()).toThrow(
        'Missing environment variables: DB_PASSWORD'
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
    it('should return the correct connection configuration', () => {
      const connectionConfig = getConnectionConfig();
      expect(connectionConfig).toEqual({
        host: 'localhost',
        database: 'test_db',
        user: 'test_user',
        password: 'test_password', // Mocked password
        port: '5432',
      });
    });
    
    it('should return undefined for missing environment variables', () => {
      delete process.env.DB_NAME;
      const connectionConfig = getConnectionConfig();
      expect(connectionConfig.database).toBeUndefined();
    });
    
    it('should handle non-numeric port values gracefully', () => {
      setEnvVars({ DB_PORT: 'invalid' });
      const connectionConfig = getConnectionConfig();
      expect(connectionConfig.port).toBe('invalid'); // Raw invalid value
    });
  });
});
