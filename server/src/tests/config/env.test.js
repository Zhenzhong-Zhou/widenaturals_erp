const { loadEnv, validateEnv, loadSecret } = require('../../../src/config/env');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { logWarn, logError } = require('../../../src/utils/logger-helper');
const AppError = require('../../../src/utils/app-error');

jest.mock('dotenv');
jest.mock('fs');
jest.mock('../../../src/utils/logger-helper', () => ({
  logWarn: jest.fn(),
  logError: jest.fn(),
}));

describe('Environment Variables', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    jest.clearAllMocks();
    delete process.env.TEST_VAR;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('loadSecret', () => {
    it('should load secret from Docker if available', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('secret_value');
      const secret = loadSecret('test_secret', 'TEST_VAR');
      expect(secret).toBe('secret_value');
    });

    it('should fall back to environment variable if Docker secret is unavailable', () => {
      fs.existsSync.mockReturnValue(false);
      process.env.TEST_VAR = 'env_value';
      const secret = loadSecret('test_secret', 'TEST_VAR');
      expect(secret).toBe('env_value');
    });

    it('should return null if both Docker secret and environment variable are missing', () => {
      fs.existsSync.mockReturnValue(false);
      const secret = loadSecret('test_secret', 'TEST_VAR');
      expect(secret).toBeNull();
    });
  });

  describe('loadEnv', () => {
    it('should load development environment variables correctly', () => {
      process.env.NODE_ENV = 'development';
      fs.existsSync.mockImplementation(
        (filePath) =>
          filePath.includes('.env.defaults') ||
          filePath.includes('development/.env.server') ||
          filePath.includes('development/.env.database')
      );

      dotenv.config.mockImplementation(({ path }) => ({
        path,
      }));

      const result = loadEnv();
      expect(result).toEqual(
        expect.objectContaining({
          env: 'development',
        })
      );
      expect(dotenv.config).toHaveBeenCalledTimes(3);
      expect(logWarn).not.toHaveBeenCalled();
    });

    it('should log an error if environment files are missing', () => {
      fs.existsSync.mockReturnValue(false);
      process.env.NODE_ENV = 'development';

      loadEnv();
      expect(logError).toHaveBeenCalledWith(
        expect.stringContaining('Environment file not found:')
      );
    });

    it('should throw an error for invalid NODE_ENV', () => {
      process.env.NODE_ENV = 'invalid_env';
      expect(() => loadEnv()).toThrow(
        'Invalid NODE_ENV: invalid_env. Allowed values: development, test, staging, production'
      );
    });
  });

  describe('validateEnv', () => {
    const groups = {
      general: [
        { envVar: 'PORT', required: true },
        { envVar: 'ALLOWED_ORIGINS', required: true },
        { envVar: 'LOGS_DIR', required: true, defaultValue: './logs' },
      ],
      jwt: [
        {
          envVar: 'JWT_ACCESS_SECRET',
          secret: () => 'access_secret',
          required: true,
        },
        {
          envVar: 'JWT_REFRESH_SECRET',
          secret: () => 'refresh_secret',
          required: true,
        },
      ],
    };

    it('should validate required variables without errors', () => {
      process.env.PORT = '3000';
      process.env.ALLOWED_ORIGINS = '*';
      process.env.LOGS_DIR = './logs';

      expect(() => validateEnv(groups)).not.toThrow();
    });

    it('should use default values if variables are missing but not required', () => {
      process.env.PORT = '3000';
      process.env.ALLOWED_ORIGINS = '*';

      validateEnv(groups);
      expect(process.env.LOGS_DIR).toBe('./logs');
    });

    it('should throw an error if required variables are missing', () => {
      delete process.env.PORT;

      try {
        validateEnv(groups);
      } catch (error) {
        // Assert that the error is thrown
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe(
          'Missing required environment variables or secrets: PORT'
        );
      }

      // Assert that logError was called with the appropriate message
      expect(logError).toHaveBeenCalledWith(
        'Missing required environment variables or secrets: PORT'
      );
    });

    it('should use secrets if provided and validate correctly', () => {
      process.env.PORT = '3000';
      process.env.ALLOWED_ORIGINS = '*';

      const modifiedGroups = {
        jwt: [
          { envVar: 'JWT_ACCESS_SECRET', secret: () => null, required: true },
        ],
      };

      expect(() => validateEnv(modifiedGroups)).toThrow(
        'Missing required environment variables or secrets: JWT_ACCESS_SECRET'
      );
    });
  });
});
