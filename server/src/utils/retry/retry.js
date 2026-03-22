const { isRetryableDbError } = require('../db/db-error-utils');
const AppError = require('../AppError');
const { normalizeAppError } = require('../errors/error-normalizer');
const { logRetryWarning } = require('../db-logger');

/**
 * Retry an asynchronous function with exponential backoff and jitter.
 *
 * Designed for handling transient failures such as:
 * - Database connection issues
 * - Network timeouts
 * - Serialization conflicts
 *
 * Features:
 * - Exponential backoff with jitter (prevents thundering herd)
 * - Retry condition control (pluggable)
 * - Max delay cap to prevent excessive wait times
 * - Preserves AppError when appropriate
 *
 * @param {() => Promise<any>} fn - Async function to execute
 * @param {Object} [options]
 * @param {number} [options.retries=3] - Number of retry attempts (excluding initial attempt)
 * @param {number} [options.baseDelay=500] - Base delay in ms
 * @param {number} [options.maxDelay=5000] - Maximum delay cap
 * @param {(error: any) => boolean} [options.shouldRetry] - Retry condition function
 * @returns {Promise<any>}
 * @throws {Error}
 */
const retry = async (
  fn,
  {
    retries = 3,
    baseDelay = 500,
    maxDelay = 5000,
    shouldRetry = isRetryableDbError,
  } = {}
) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  
  let attempt = 0;
  const maxAttempts = retries + 1;
  
  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      //--------------------------------------------------
      // Check retry eligibility
      //--------------------------------------------------
      if (!shouldRetry(error) || attempt === retries) {
        if (error instanceof AppError) {
          throw error;
        }
        
        throw normalizeAppError(error, {
          message: 'Function execution failed after retries',
          context: 'retry',
          meta: {
            attempts: attempt + 1,
            retries,
          },
        });
      }
      
      //--------------------------------------------------
      // Exponential backoff with jitter
      //--------------------------------------------------
      attempt++;
      
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const delayMs = Math.min(exponentialDelay + jitter, maxDelay);
      
      logRetryWarning(attempt, retries, error, delayMs);
      
      await delay(delayMs);
    }
  }
};

module.exports = {
  retry,
};
