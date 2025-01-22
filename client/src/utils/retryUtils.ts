import { AppError, ErrorType } from '@utils/AppError.tsx';

export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number,
  retryErrorMessage: string
): Promise<T> => {
  let lastError: any = null; // Store the original error
  
  while (retries > 0) {
    try {
      return await fn(); // Attempt the function
    } catch (error) {
      lastError = error; // Preserve the original error
      retries -= 1;
      // console.error(error);
      if (retries === 0) {
        // Throw the original error after retries are exhausted
        if (lastError.response) {
          // If the last error is an AxiosError, pass it directly
          throw lastError;
        } else {
          // For non-Axios errors, wrap them with additional retry context
          throw AppError.create(
            ErrorType.GlobalError,
            retryErrorMessage,
            500,
            {
              rootCause: lastError?.message || 'Unknown root cause',
              retryMessage: retryErrorMessage,
            }
          );
        }
      }
      
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  // Should never reach here
  throw AppError.create(ErrorType.GlobalError, retryErrorMessage, 500);
};
