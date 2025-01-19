import axiosInstance from '@utils/axiosConfig';
import AppError from '@utils/AppError';

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
        type: 'ServerError',
        details: response.data,
      });
    }
    
    return response.data.csrfToken;
  } catch (error: unknown) {
    // Parse and log error
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred while fetching CSRF token';
    
    console.error('CSRF Token Fetch Error:', {
      message: errorMessage,
      ...(import.meta.env.NODE_ENV !== 'production' && { stack: error instanceof Error ? error.stack : undefined }),
    });
    
    // Re-throw as AppError for consistency
    throw new AppError('Failed to fetch CSRF token', 500, {
      type: 'ServerError',
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
      // This case shouldn't occur if `fetchCsrfToken` works correctly, but handle it defensively
      console.warn('CSRF token could not be retrieved or is invalid.');
    }
  } catch (error: unknown) {
    // Normalize the error for consistent handling
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { message: 'An unknown error occurred during CSRF initialization', details: error };
    
    console.error('Failed to initialize CSRF token:', errorDetails);
    
    // Optionally log to an external monitoring service
    // AppError.reportError(new AppError('CSRF Initialization Error', 500, { type: 'SevereError', details: errorDetails }));
    
    // Rethrow error to propagate to the calling context
    throw new AppError('Failed to initialize CSRF token', 500, {
      type: 'SevereError',
      details: errorDetails,
    });
  }
};

const getCsrfToken = async () => {
  return sessionStorage.getItem('csrfToken');
}

export const csrfService = {
  fetchCsrfToken,
  initializeCsrfToken,
  getCsrfToken,
};