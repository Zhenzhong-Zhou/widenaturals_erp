import { AppError, ErrorType } from '@utils/AppError.tsx';

export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number,
  delay: number, // Add delay parameter
  errorMessage: string
): Promise<T> => {
  while (retries > 0) {
    try {
      return await fn();
    } catch (error) {
      retries -= 1;
      if (retries === 0) {
        throw AppError.create(
          ErrorType.GlobalError,
          errorMessage,
          500,
          error instanceof Error ? { message: error.message } : undefined
        );
      }
      
      // Add delay between retries
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw AppError.create(ErrorType.GlobalError, errorMessage, 500); // Should never reach here
};
