import { sleep } from '@utils/async';

export type RetryPredicate = (error: unknown) => boolean;

/**
 * Executes an async operation with retry and exponential backoff.
 *
 * Notes:
 * - Retries are intended ONLY for transient transport failures.
 * - This utility must not classify or wrap errors.
 * - The last error is rethrown as-is.
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number,
  initialDelayMs: number,
  backoffFactor = 2,
  shouldRetry?: RetryPredicate
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (
        attempt === retries ||
        shouldRetry?.(error) === false
      ) {
        throw error;
      }
      
      const delayMs =
        initialDelayMs * Math.pow(backoffFactor, attempt - 1);
      
      await sleep(delayMs);
    }
  }
  
  throw lastError;
};
