const { loadEnv } = require('../../../src/config/env');
const dotenv = require('dotenv');
const path = require('path');

jest.mock('dotenv');

describe('Environment Variables', () => {
  let originalEnv;
  let logSpy;
  let warnSpy;
  
  beforeEach(() => {
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;
    
    // Set default required variables
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
    process.env.PORT = '3000';
    
    // Mock console and dotenv
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    dotenv.config.mockClear();
    dotenv.config.mockImplementation(({ path }) => {
      if (path.includes('.env.server') || path.includes('.env.database')) {
        return { error: new Error(`File not found: ${path}`) }; // Simulate missing file
      }
      return { parsed: { TEST_VAR: 'test' } }; // Simulate successful loading
    });
  });
  
  afterEach(() => {
    // Restore NODE_ENV and console
    process.env.NODE_ENV = originalEnv;
    logSpy.mockRestore();
    warnSpy.mockRestore();
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
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid NODE_ENV value')
    );
  });
  
  it('should load the correct environment for production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGINS = 'http://example.com';
    process.env.PORT = '3000';
    
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
      if (path.includes('.env.server') || path.includes('.env.defaults')) {
        return { error: new Error(`File not found: ${path}`) }; // Simulate missing files
      }
      return { parsed: { TEST_VAR: 'test' } }; // Simulate successful parsing
    });
    
    process.env.NODE_ENV = 'development';
    const env = loadEnv();
    expect(env).toBe('development');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Warning: Could not load')
    );
  });
});
