import axiosInstance from '@utils/axiosConfig';
import { AppError, ErrorType } from '@utils/AppError';
import { withRetry } from '@utils/retryUtils.ts';
import { getCsrfTokenThunk } from '../features/csrf/state/csrfThunk.ts';
import type { AppDispatch } from '../store/store.ts';

/**
 * Fetches the CSRF token from the backend.
 * @returns {Promise<string>} The CSRF token.
 */
const fetchCsrfToken = async (): Promise<string> => {
  try {
    const response = await axiosInstance.get<{ csrfToken: string }>('/csrf/token', {
      withCredentials: true, // Ensure cookies are included for CSRF protection
    });
    
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
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      ...(import.meta.env.NODE_ENV !== 'production' && {
        stack: error instanceof Error ? error.stack : undefined,
      }),
    });
    
    // Re-throw as AppError for consistent error handling
    throw new AppError('Failed to fetch CSRF token', 500, {
      type: ErrorType.ServerError,
      details: error instanceof Error ? error.message : undefined,
    });
  }
};

/**
 * Initializes CSRF token using Redux Thunk.
 * @param {AppDispatch} dispatch - The Redux dispatch function.
 * @returns {Promise<void>}
 */
const initializeCsrfToken = async (dispatch: AppDispatch): Promise<void> => {
  try {
    await withRetry(
      () => dispatch(getCsrfTokenThunk()).unwrap(),
      3, // Retry attempts
      'Failed to initialize CSRF token'
    );
  } catch (error) {
    throw new AppError('CSRF Initialization Failed', 500, {
      type: ErrorType.GlobalError,
      details: error instanceof Error ? error.message : undefined,
    });
  }
};

/**
 * Fetches and initializes the CSRF token with retry logic.
 * @param {AppDispatch} dispatch - The Redux dispatch function.
 * @returns {Promise<void>}
 */
const fetchCsrfTokenWithRetry = async (dispatch: AppDispatch): Promise<void> => {
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
