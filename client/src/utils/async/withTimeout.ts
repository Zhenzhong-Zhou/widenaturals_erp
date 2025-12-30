import { AppError, ErrorType } from '@utils/error';

export interface TimeoutOptions {
  /**
   * Maximum execution time in milliseconds.
   */
  timeoutMs: number;
  
  /**
   * Message used when the timeout is exceeded.
   * This message is user-facing and should be human-readable.
   */
  timeoutMessage: string;
  
  /**
   * Optional AbortController for external cancellation.
   * If not provided, a local controller is created.
   */
  controller?: AbortController;
}

/**
 * Executes an async operation with a hard timeout.
 *
 * Responsibilities:
 * - Enforces a strict execution deadline
 * - Supports AbortController-based cancellation
 * - Normalizes timeout failures into `AppError`
 *
 * Design notes:
 * - The promise factory is invoked lazily
 * - Timeout applies only to execution time
 * - This is a **transport-level utility**
 *
 * @typeParam T - Resolved value type
 *
 * @param promiseFn - Async factory that accepts an optional AbortSignal
 * @param options - Timeout configuration
 *
 * @throws {AppError}
 * Throws `ErrorType.Timeout` when execution exceeds `timeoutMs`
 */
export const withTimeout = async <T>(
  promiseFn: (signal?: AbortSignal) => Promise<T>,
  options: TimeoutOptions
): Promise<T>=> {
  const {
    timeoutMs,
    timeoutMessage,
    controller = new AbortController(),
  } = options;
  
  const { signal } = controller;
  
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  try {
    return await promiseFn(signal);
  } catch (error) {
    if (signal.aborted) {
      throw new AppError(timeoutMessage, {
        type: ErrorType.Timeout,
      });
    }
    
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
