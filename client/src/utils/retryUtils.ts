import { AppError, ErrorType } from '@utils/AppError.tsx';

export const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number,
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
    }
  }
  throw AppError.create(ErrorType.GlobalError, errorMessage, 500); // Should never reach here
};
