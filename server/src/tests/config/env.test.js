const { loadEnv, validateEnv, loadSecret } = require('../../../src/config/env');
const dotenv = require('dotenv');
const path = require('path');
const { logWarn, logError, logFatal } = require('../../../src/utils/logger-helper');

jest.mock('dotenv');
jest.mock('fs', () => ({
  existsSync: jest.fn((path) => path === '/run/secrets/test_secret'),
  readFileSync: jest.fn(() => 'secret_value'),
}));
jest.mock('fs', () => ({
  existsSync: jest.fn((path) => path.includes('/run/secrets/')),
  readFileSync: jest.fn(() => 'secret_value'),
}));

jest.mock('../../../src/utils/logger-helper', () => ({
  logWarn: jest.fn(),
  logError: jest.fn(),
  logFatal: jest.fn(),
}));

describe('Environment Variables', () => {
  let originalEnv;
  
  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    jest.clearAllMocks();
    delete process.env.TEST_VAR;
  });
  
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });
  
  it('should load development environment variables correctly', () => {
    process.env.NODE_ENV = 'development';
    
    const result = loadEnv();
    expect(result).toEqual(
      expect.objectContaining({
        env: 'development',
        jwtAccessSecret: 'secret_value', // Mocked secret value
        jwtRefreshSecret: 'secret_value', // Mocked secret value
        dbPassword: 'secret_value', // Mocked secret value
      })
    );
    
    expect(dotenv.config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '../../../../env/development/.env.server'),
    });
    expect(dotenv.config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '../../../../env/development/.env.database'),
    });
  });
  
  it('should log a warning if environment files are missing', () => {
    require('fs').existsSync.mockReturnValue(false);
    process.env.NODE_ENV = 'development';
    
    loadEnv();
    expect(logWarn).toHaveBeenCalledWith(
      expect.stringContaining('Warning: Could not load environment file at')
    );
  });
  
  it('should throw an error for invalid NODE_ENV', () => {
    process.env.NODE_ENV = 'invalid_env';
    expect(() => loadEnv()).toThrow(
      'Invalid NODE_ENV value: invalid_env. Allowed values: development, test, staging, production'
    );
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('Invalid NODE_ENV value')
    );
  });
  
  it('should validate required variables in production', () => {
    process.env.NODE_ENV = 'production';
    
    expect(() => loadEnv()).toThrow(
      'Critical secrets are missing in production.'
    );
    expect(logFatal).toHaveBeenCalledWith(
      expect.stringContaining('Critical secrets are missing in production.')
    );
  });
  
  it.skip('should load Docker secrets if available', () => {
    const secret = loadSecret('test_secret', 'TEST_VAR');
    expect(secret).toBe('secret_value'); // Mocked Docker secret
  });
  
  it('should fall back to environment variables if Docker secrets are unavailable', () => {
    process.env.TEST_VAR = 'env_value';
    const secret = loadSecret('nonexistent_secret', 'TEST_VAR');
    expect(secret).toBe('env_value'); // Fallback to environment variable
  });
  
  it.skip('should default to development if NODE_ENV is undefined', () => {
    delete process.env.NODE_ENV;
    const result = loadEnv();
    expect(result).toEqual(
      expect.objectContaining({
        env: 'development',
        jwtAccessSecret: 'secret_value', // Mocked secret value
        jwtRefreshSecret: 'secret_value', // Mocked secret value
        dbPassword: 'secret_value', // Mocked secret value
      })
    );
  });
  
  it('should call logWarn for missing environment files', () => {
    require('fs').existsSync.mockReturnValue(false);
    process.env.NODE_ENV = 'test';
    
    loadEnv();
    expect(logWarn).toHaveBeenCalledWith(
      expect.stringContaining('Warning: Could not load environment file at')
    );
  });
  
  it('should validate environment variables using validateEnv', () => {
    const config = [
      { envVar: 'TEST_VAR', secret: 'test_secret', required: true },
    ];
    process.env.TEST_VAR = 'test_value';
    
    expect(() => validateEnv(config)).not.toThrow();
  });
  
  it('should throw an error if required variables are missing', () => {
    const config = [
      { envVar: 'MISSING_VAR', secret: 'missing_secret', required: true },
    ];
    
    require('fs').existsSync.mockReturnValue(false);
    
    expect(() => validateEnv(config)).toThrow(
      'Missing required environment variables or secrets: missing_secret'
    );
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('Missing required environment variables or secrets')
    );
  });
});
