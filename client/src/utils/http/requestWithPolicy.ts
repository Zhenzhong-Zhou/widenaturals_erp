import {
  defaultRetryPredicate,
  withRetry,
  withTimeout
} from '@utils/async';

export interface RequestPolicyOptions {
  /** Number of retry attempts (idempotent requests only) */
  retries?: number;
  
  /** Initial delay between retries (milliseconds) */
  delayMs?: number;
  
  /** Hard timeout for EACH request attempt (milliseconds) */
  timeoutMs?: number;
  
  /** Exponential backoff multiplier */
  backoffFactor?: number;
  
  /** Optional retry predicate override */
  shouldRetry?: (error: unknown) => boolean;
  
  /** Error message used when a request attempt times out */
  timeoutMessage?: string;
}

/**
 * Executes an async request with retry and timeout policy applied.
 *
 * Execution model:
 *   retry(
 *     timeout(request)
 *   )
 *
 * Notes:
 * - Timeout applies to EACH attempt.
 * - Retries are only applied if `retries > 0`.
 * - Errors propagate without re-wrapping.
 *
 * @typeParam T - The resolved value type.
 */
export const requestWithPolicy = async <T>(
  requestFn: (signal?: AbortSignal) => Promise<T>,
  options: RequestPolicyOptions = {}
): Promise<T> => {
  const {
    retries = 0,
    delayMs = 1000,
    timeoutMs = 5000,
    backoffFactor = 2,
    shouldRetry = defaultRetryPredicate,
    timeoutMessage = 'Request timed out',
  } = options;
  
  /**
   * Single request attempt with timeout + abort support
   */
  const attempt = () =>
    withTimeout(
      (signal) => requestFn(signal),
      {
        timeoutMs,
        timeoutMessage,
      }
    );
  
  if (retries > 0) {
    return withRetry(
      attempt,
      retries,
      delayMs,
      backoffFactor,
      shouldRetry
    );
  }
  
  return attempt();
};
