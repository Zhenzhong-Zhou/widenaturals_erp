import { AppError, ErrorType } from '@utils/AppError.tsx';

export const withTimeout = async <T>(
  promise: Promise<T>,
  timeout: number,
  timeoutMessage: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(AppError.create(ErrorType.TimeoutError, timeoutMessage, 408)), timeout)
    ),
  ]);
};
