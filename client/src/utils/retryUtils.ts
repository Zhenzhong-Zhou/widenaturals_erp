import { AppError, ErrorType } from '@utils/AppError';

export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number,
  retryErrorMessage: string,
  backoffFactor: number = 2 // Multiplier for backoff
): Promise<T> => {
  let lastError: any = null;

  while (retries > 0) {
    try {
      return await fn(); // Attempt the function
    } catch (error) {
      lastError = error;
      retries -= 1;

      if (retries === 0) {
        // Throw the original error after retries are exhausted
        if (lastError.response) {
          // If the last error is an AxiosError, pass it directly
          throw lastError;
        } else {
          // For non-Axios errors, wrap them with additional retry context
          throw AppError.create(ErrorType.GlobalError, retryErrorMessage, 500, {
            rootCause: lastError?.message || 'Unknown root cause',
            retryMessage: retryErrorMessage,
          });
        }
      }

      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffFactor; // Increase delay for the next attempt
    }
  }

  // Should never reach here
  throw AppError.create(ErrorType.GlobalError, retryErrorMessage, 500);
};
