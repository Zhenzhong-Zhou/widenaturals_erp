import axiosInstance from '@utils/axiosConfig';
import { AppError, ErrorType } from '@utils/AppError';
import { withTimeout } from '@utils/timeoutUtils.ts';
import { withRetry } from '@utils/retryUtils.ts';
import { getCsrfTokenThunk } from '../features/csrf/state/csrfThunk.ts';
import type { AppDispatch } from '../store/store.ts';
import { resetCsrfToken } from '../features/csrf/state/csrfSlice.ts';

/**
 * Fetches the CSRF token from the backend with retry and timeout logic.
 * @returns {Promise<string>} The CSRF token.
 */
const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await withTimeout(
      withRetry(
        () =>
          axiosInstance.get<{ csrfToken: string }>('/csrf/token', {
            withCredentials: true, // Ensure cookies are included for CSRF protection
          }),
        3, // Retry attempts
        'Failed to fetch CSRF token' // Error message for retries
      ),
      5000, // Timeout in milliseconds
      'CSRF token fetch timed out' // Timeout error message
    );

    // Validate response structure
    if (!response.data || !response.data.csrfToken) {
      throw new AppError('Invalid CSRF token response', 500, {
        type: ErrorType.ServerError,
        details: response.data,
      });
    }

    return response.data.csrfToken;
  } catch (error: unknown) {
    // Log the error for debugging purposes
    console.error('CSRF Token Fetch Error:', {
      message:
        error instanceof AppError ? error.message : 'Unknown error occurred',
      ...(import.meta.env.NODE_ENV !== 'production' && {
        stack: error instanceof AppError ? error.stack : undefined,
      }),
    });

    // Re-throw as AppError for consistent error handling
    throw new AppError('Failed to fetch CSRF token', 500, {
      type: ErrorType.ServerError,
      details: error instanceof AppError ? error.message : undefined,
    });
  }
};

/**
 * Initializes CSRF token using Redux Thunk with retry and timeout.
 * @param {AppDispatch} dispatch - The Redux dispatch function.
 * @returns {Promise<void>}
 */
const initializeCsrfToken = async (dispatch: AppDispatch): Promise<void> => {
  try {
    // Set a timeout for the initialization process
    await withTimeout(
      withRetry(
        () => dispatch(getCsrfTokenThunk()).unwrap(),
        3, // Retry attempts
        'Failed to initialize CSRF token'
      ),
      5000, // Timeout duration in milliseconds
      'CSRF token initialization timed out'
    );
  } catch (error) {
    // Reset CSRF state on persistent error
    dispatch(resetCsrfToken());
    throw new AppError('CSRF Initialization Failed', 500, {
      type: ErrorType.GlobalError,
      details: error instanceof AppError ? error.message : undefined,
    });
  }
};

/**
 * Fetches and initializes the CSRF token with retry and timeout logic.
 * @param {AppDispatch} dispatch - The Redux dispatch function.
 * @returns {Promise<void>}
 */
const fetchCsrfTokenWithRetry = async (
  dispatch: AppDispatch
): Promise<void> => {
  try {
    await initializeCsrfToken(dispatch);
  } catch (error) {
    throw new AppError('Failed to fetch CSRF token after retries', 500, {
      type: ErrorType.GlobalError,
      details: error instanceof Error ? error.message : undefined,
    });
  }
};

export const csrfService = {
  fetchCsrfToken,
  initializeCsrfToken,
  fetchCsrfTokenWithRetry,
};
