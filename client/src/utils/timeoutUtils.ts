import { AppError, ErrorType } from '@utils/AppError';

// Overload declarations
export function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  timeoutMessage: string
): Promise<T>;

export function withTimeout<T>(
  promiseFn: () => Promise<T>,
  timeout: number,
  timeoutMessage: string
): Promise<T>;

// Implementation
export async function withTimeout<T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  timeout: number,
  timeoutMessage: string
): Promise<T> {
  const promise =
    typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn;

  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(AppError.create(ErrorType.TimeoutError, timeoutMessage, 408)),
        timeout
      )
    ),
  ]);
}
