import axiosInstance from '@utils/axiosConfig';
import { AppError, ErrorType } from '@utils/AppError';

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
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * Initializes CSRF token by fetching it from the backend and setting it in Axios headers.
 * @returns {Promise<void>}
 */
const initializeCsrfToken = async (): Promise<void> => {
  try {
    const csrfToken = await fetchCsrfToken();
    
    if (csrfToken) {
      // Set CSRF token in Axios defaults for all subsequent requests
      axiosInstance.defaults.headers.common['X-CSRF-Token'] = csrfToken;
      console.info('CSRF token successfully initialized and set in Axios headers.');
    } else {
      // Handle unexpected behavior defensively
      console.warn('CSRF token could not be retrieved or is invalid.');
    }
  } catch (error: unknown) {
    // Normalize and log the error
    const errorDetails = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: 'Unknown error during CSRF initialization', details: error };
    
    console.error('Failed to initialize CSRF token:', errorDetails);
    
    // Re-throw error to propagate to the calling context
    throw new AppError('Failed to initialize CSRF token', 500, {
      type: ErrorType.SevereError,
      details: errorDetails,
    });
  }
};

/**
 * Retrieves the CSRF token from sessionStorage.
 * @returns {string | null} The CSRF token.
 */
const getCsrfToken = (): string | null => {
  return sessionStorage.getItem('csrfToken');
};

export const csrfService = {
  fetchCsrfToken,
  initializeCsrfToken,
  getCsrfToken,
};
