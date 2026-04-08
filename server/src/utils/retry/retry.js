/**
 * @file retry.js
 * @description Async retry utility with exponential backoff and jitter.
 *
 * Designed for transient failures in I/O-bound operations:
 *   - Database connection timeouts and serialization conflicts
 *   - Network timeouts to external services
 *   - Temporary resource unavailability
 *
 * Retry behaviour:
 *   - Exponential backoff with random jitter prevents thundering herd
 *     (multiple clients retrying in lockstep after a shared failure).
 *   - Delay is capped at `maxDelay` to avoid unbounded wait times.
 *   - AppError instances pass through unchanged — they represent known,
 *     already-normalized errors that should not be re-wrapped.
 *   - Unknown errors are wrapped as AppError.serviceError on final failure
 *     so the error handler pipeline always receives a consistent shape.
 *
 * Usage:
 *   Use `shouldRetry` to control which errors trigger a retry. The default
 *   is `isRetryableDbError` — pass a custom function for other use cases.
 */

'use strict';

const AppError               = require('../AppError');
const { isRetryableDbError } = require('../db/db-error-utils');
const { logRetryWarning }    = require('../db-logger');

const CONTEXT = 'utils/retry';

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

/**
 * Returns a promise that resolves after `ms` milliseconds.
 *
 * @param {number} ms - Delay duration in milliseconds.
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Computes the next backoff delay with exponential growth and random jitter.
 *
 * Formula: min(baseDelay * 2^attempt + jitter, maxDelay)
 * Jitter range: 0–30% of the exponential component — spreads retry storms
 * across a window without making delays unpredictably large.
 *
 * @param {number} attempt   - Current attempt index (1-based).
 * @param {number} baseDelay - Base delay in milliseconds.
 * @param {number} maxDelay  - Maximum allowed delay in milliseconds.
 * @returns {number} Computed delay in milliseconds.
 */
const computeBackoff = (attempt, baseDelay, maxDelay) => {
  const exponential = baseDelay * Math.pow(2, attempt);
  const jitter      = Math.random() * 0.3 * exponential;
  return Math.min(exponential + jitter, maxDelay);
};

// -----------------------------------------------------------------------------
// Retry utility
// -----------------------------------------------------------------------------

/**
 * Executes an async function with exponential backoff retry on transient failures.
 *
 * Retry logic:
 *   - Retries only if `shouldRetry(error)` returns `true`.
 *   - On final failure (retries exhausted or non-retryable error):
 *     - AppError instances are rethrown unchanged.
 *     - All other errors are wrapped as `AppError.serviceError` so the
 *       error handler pipeline always receives a normalized AppError.
 *
 * @param {() => Promise<any>} fn - Async function to execute and retry.
 * @param {object}   [options={}]
 * @param {number}   [options.retries=3]
 *   Number of retry attempts after the initial call (total attempts = retries + 1).
 * @param {number}   [options.baseDelay=500]
 *   Base delay in milliseconds for the first retry. Subsequent retries grow
 *   exponentially from this value.
 * @param {number}   [options.maxDelay=5000]
 *   Maximum delay cap in milliseconds. Prevents unbounded wait times on
 *   high retry counts.
 * @param {(error: any) => boolean} [options.shouldRetry=isRetryableDbError]
 *   Predicate that determines whether an error warrants a retry.
 *   Return `true` to retry, `false` to fail immediately.
 * @returns {Promise<any>} Resolved value of `fn` on success.
 * @throws {AppError} On final failure — either the original AppError or a
 *   wrapped `AppError.serviceError` for unknown errors.
 *
 * @example
 * // Default — retries on transient DB errors
 * const result = await retry(() => db.query('SELECT 1'));
 *
 * @example
 * // Custom retry condition and options
 * const result = await retry(
 *   () => externalApiCall(),
 *   {
 *     retries:     5,
 *     baseDelay:   200,
 *     maxDelay:    10000,
 *     shouldRetry: (err) => err.code === 'ECONNRESET',
 *   }
 * );
 */
const retry = async (
  fn,
  {
    retries     = 3,
    baseDelay   = 500,
    maxDelay    = 5000,
    shouldRetry = isRetryableDbError,
  } = {}
) => {
  let attempt = 0;
  
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt    = attempt === retries;
      const isRetryable      = shouldRetry(error);
      
      // -----------------------------------------------------------------
      // Final failure — either non-retryable or retries exhausted.
      // AppError passes through unchanged (already normalized at source).
      // Unknown errors are wrapped so the error handler always receives
      // a consistent AppError shape.
      // -----------------------------------------------------------------
      if (!isRetryable || isLastAttempt) {
        if (error instanceof AppError) throw error;
        
        throw AppError.serviceError(
          'Operation failed after retries.',
          {
            context: CONTEXT,
            meta: {
              attempts: attempt + 1,
              retries,
              originalMessage: error.message,
              originalName:    error.name,
            },
          }
        );
      }
      
      // -----------------------------------------------------------------
      // Transient failure — wait and retry.
      // -----------------------------------------------------------------
      attempt++;
      
      const delayMs = computeBackoff(attempt, baseDelay, maxDelay);
      
      logRetryWarning(attempt, retries, error, delayMs);
      
      await delay(delayMs);
    }
  }
};

module.exports = {
  retry,
};
