const { pool, query, getClient, testConnection, closePool, retry } = require('../../database/db');
const { logInfo, logError, logWarn } = require('../../utils/logger-helper');

// Mock logger to suppress actual logging during tests
jest.mock('../../utils/logger-helper', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn(),
}));

describe('Database Utility Tests', () => {
  afterAll(async () => {
    // Ensure proper cleanup of database connections
    await closePool();
  });
  
  test('testConnection should confirm healthy database connection', async () => {
    await expect(testConnection()).resolves.not.toThrow();
    expect(logInfo).toHaveBeenCalledWith('Database connection is healthy.');
  });
  
  test('query should execute SQL and return results', async () => {
    const result = await query('SELECT 1 AS value');
    expect(result.rows).toEqual([{ value: 1 }]);
  });
  
  test('query should handle SQL errors gracefully', async () => {
    const mockError = new Error('Table does not exist');
    pool.emit('error', mockError); // Simulate a pool error
    
    await expect(query('SELECT * FROM non_existing_table')).rejects.toThrow();
    expect(logError).toHaveBeenCalledWith(expect.any(Error), null, {
      additionalInfo: 'Database connection error',
    });
  });
  
  test('getClient should acquire and release a client successfully', async () => {
    const client = await getClient();
    expect(client).toHaveProperty('query'); // Check if client has query method
    await client.release();
    expect(pool.idleCount).toBeGreaterThanOrEqual(1); // Ensure client is released
  });
  
  test('retry should handle transient failures and succeed eventually', async () => {
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
  
  test('closePool should close all database connections', async () => {
    await closePool();
    await expect(pool.connect()).rejects.toThrow(
      /Cannot use a pool after calling end on the pool/
    ); // Update expected error message
    expect(logInfo).toHaveBeenCalledWith('Closing database connection pool...');
    expect(logInfo).toHaveBeenCalledWith('Database connection pool closed.');
  });
});
