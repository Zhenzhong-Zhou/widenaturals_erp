const { loadEnv } = require('../../../src/config/env');
const dotenv = require('dotenv');
const path = require('path');

jest.mock('dotenv');

describe('Environment Variables', () => {
  let originalEnv;
  
  beforeEach(() => {
    // Save the original NODE_ENV
    originalEnv = process.env.NODE_ENV;
    dotenv.config.mockClear(); // Clear mock history for each test
    
    // Default mock implementation
    dotenv.config.mockImplementation(({ path }) => {
      return { parsed: { TEST_VAR: 'test' } }; // Simulate successful loading
    });
  });
  
  afterEach(() => {
    // Restore the original NODE_ENV
    process.env.NODE_ENV = originalEnv;
  });
  
  it('should load the correct environment for development', () => {
    process.env.NODE_ENV = 'development';
    const env = loadEnv();
    expect(env).toBe('development');
    expect(dotenv.config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '../../../../env/development/.env.server'),
    });
    expect(dotenv.config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '../../../../env/development/.env.database'),
    });
  });
  
  it('should load the correct environment for test', () => {
    process.env.NODE_ENV = 'test';
    const env = loadEnv();
    expect(env).toBe('test');
    expect(dotenv.config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '../../../../env/test/.env.server'),
    });
    expect(dotenv.config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '../../../../env/test/.env.database'),
    });
  });
  
  it('should throw an error for invalid environments', () => {
    process.env.NODE_ENV = 'invalid_env';
    expect(() => loadEnv()).toThrow(
      'Invalid NODE_ENV value: invalid_env. Allowed values: development, test, staging, production'
    );
  });
  
  it('should load the correct environment for production', () => {
    process.env.NODE_ENV = 'production';
    const env = loadEnv();
    expect(env).toBe('production');
    expect(dotenv.config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '../../../../env/production/.env.server'),
    });
    expect(dotenv.config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '../../../../env/production/.env.database'),
    });
  });
  
  it('should default to development if NODE_ENV is undefined', () => {
    delete process.env.NODE_ENV;
    const env = loadEnv();
    expect(env).toBe('development');
    expect(dotenv.config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '../../../../env/development/.env.server'),
    });
    expect(dotenv.config).toHaveBeenCalledWith({
      path: path.resolve(__dirname, '../../../../env/development/.env.database'),
    });
  });
  
  it('should log warnings if .env files are missing', () => {
    // Mock dotenv.config to return an error for .env.server
    dotenv.config.mockImplementation(({ path }) => {
      if (path.includes('.env.server')) {
        return { error: new Error('File not found') }; // Simulate a failure
      }
      return { parsed: { TEST_VAR: 'test' } }; // Simulate successful parsing
    });
    
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    process.env.NODE_ENV = 'development';
    
    const env = loadEnv();
    expect(env).toBe('development');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Warning: Could not load')
    );
    warnSpy.mockRestore();
  });
});
