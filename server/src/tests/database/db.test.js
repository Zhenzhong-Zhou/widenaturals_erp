const {
  pool,
  query,
  getClient,
  testConnection,
  closePool,
  retry,
} = require('../../database/db');
const {
  logInfo,
  logError,
  logWarn,
  logDebug,
} = require('../../utils/logger-helper');

// Mock logger to suppress actual logging during tests
jest.mock('../../utils/logger-helper', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
  logDebug: jest.fn(),
}));

describe('Database Utility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Ensure proper cleanup of database connections
    await closePool();
  });

  describe('testConnection', () => {
    it('should confirm a healthy database connection', async () => {
      await expect(testConnection()).resolves.not.toThrow();
      expect(logInfo).toHaveBeenCalledWith('Database connection is healthy.');
    });

    it('should log an error if the database connection fails', async () => {
      jest.spyOn(pool, 'connect').mockImplementationOnce(() => {
        throw new Error('Connection failed');
      });

      await expect(testConnection()).rejects.toThrow('Connection failed');
      expect(logError).toHaveBeenCalledWith(expect.any(Error), null, {
        additionalInfo: 'Database connection test failed',
      });
    });
  });

  describe('query', () => {
    it('should execute SQL and return results', async () => {
      const result = await query('SELECT 1 AS value');
      expect(result.rows).toEqual([{ value: 1 }]);
    });

    it('should handle SQL errors gracefully', async () => {
      await expect(query('SELECT * FROM non_existing_table')).rejects.toThrow();
      expect(logError).toHaveBeenCalledWith(expect.any(Error), null, {
        additionalInfo: 'Database connection error', // Match this to the query implementation
      });
    });
  });

  describe('getClient', () => {
    it('should acquire and release a client successfully', async () => {
      const client = await getClient();
      expect(client).toHaveProperty('query');
      client.release(); // Release the client
      expect(pool.idleCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('retry', () => {
    it('should retry on failure and succeed eventually', async () => {
      let attempt = 0;
      const mockFunction = jest.fn(async () => {
        attempt++;
        if (attempt < 2) throw new Error('Transient error');
        return 'Success';
      });

      const result = await retry(mockFunction, 3);
      expect(result).toBe('Success');
      expect(mockFunction).toHaveBeenCalledTimes(2);
      expect(logWarn).toHaveBeenCalledWith('Retry 1/3 failed: Transient error');
    });

    it('should throw an error if retries are exhausted', async () => {
      const mockFunction = jest.fn(async () => {
        throw new Error('Persistent error');
      });

      await expect(retry(mockFunction, 2)).rejects.toThrow('Persistent error');
      expect(mockFunction).toHaveBeenCalledTimes(2); // Ensure retries match
      expect(logWarn).toHaveBeenCalledTimes(2); // Warnings should match retries
      expect(logWarn).toHaveBeenCalledWith(
        'Retry 1/2 failed: Persistent error'
      ); // First retry warning
      expect(logWarn).toHaveBeenCalledWith(
        'Retry 2/2 failed: Persistent error'
      ); // Second retry warning
    });
  });

  describe('closePool', () => {
    it('should close all database connections', async () => {
      await closePool();
      await expect(pool.connect()).rejects.toThrow(
        /Cannot use a pool after calling end on the pool/
      );
      expect(logInfo).toHaveBeenCalledWith(
        'Closing database connection pool...'
      );
      expect(logInfo).toHaveBeenCalledWith('Database connection pool closed.');
    });

    it('should handle multiple calls gracefully', async () => {
      await closePool(); // First call
      await expect(closePool()).resolves.not.toThrow(); // Second call should not fail
      expect(logWarn).toHaveBeenCalledWith(
        'Attempted to close the database connection pool, but it is already closed.'
      );
    });
  });
});
