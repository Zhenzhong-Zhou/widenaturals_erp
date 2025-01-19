import { AppError, ErrorType } from '@utils/AppError';

/**
 * Monitors CSRF status and handles errors or confirmations.
 * @param status - The CSRF loading status.
 * @param error - The CSRF error message, if any.
 */
export const monitorCsrfStatus = (status: 'idle' | 'loading' | 'succeeded' | 'failed', error?: string | null): void => {
  if (status === 'failed' && error) {
    console.error('CSRF Error:', error);
    throw AppError.create(ErrorType.GlobalError, error, 500);
  }
  if (status === 'succeeded') {
    console.info('CSRF token initialized successfully.');
  }
};
