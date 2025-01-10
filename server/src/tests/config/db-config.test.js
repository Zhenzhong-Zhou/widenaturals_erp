const {
  getPoolConfig,
  getConnectionConfig,
} = require('../../../src/config/db-config');

const { loadSecret } = require('../../../src/config/env');

jest.mock('../../../src/config/env', () => ({
  loadSecret: jest.fn(),
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
    jest.clearAllMocks(); // Clear mocks before each test
  });
  
  afterEach(() => {
    clearEnvVars(); // Clear environment variables after each test
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
      loadSecret.mockImplementation((secretName, envVarName) => {
        if (secretName === 'db_password' && envVarName === 'DB_PASSWORD') {
          return 'test_password';
        }
        return null;
      });
      
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
      loadSecret.mockReturnValue('test_password');
      
      const connectionConfig = getConnectionConfig();
      expect(connectionConfig.database).toBeUndefined();
    });
    
    it('should handle non-numeric port values gracefully', () => {
      setEnvVars({ DB_PORT: 'invalid' });
      loadSecret.mockReturnValue('test_password');
      
      const connectionConfig = getConnectionConfig();
      expect(connectionConfig.port).toBe('invalid'); // Raw invalid value
    });
    
    it('should call loadSecret for the database password', () => {
      loadSecret.mockReturnValue('test_password');
      
      const connectionConfig = getConnectionConfig();
      expect(loadSecret).toHaveBeenCalledWith('db_password', 'DB_PASSWORD');
      expect(connectionConfig.password).toBe('test_password');
    });
    
    it('should throw an error if loadSecret returns null for DB_PASSWORD', () => {
      loadSecret.mockReturnValue(null); // Simulate loadSecret returning null
      
      expect(() => getConnectionConfig()).toThrow(
        'Database password (DB_PASSWORD) is required but was not provided.'
      );
    });
  });
});
