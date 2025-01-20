import { useState } from 'react';
import { handleError, mapErrorMessage } from '../utils/errorUtils';
import { AppError, ErrorType } from '../utils/AppError';

interface ErrorHandler {
  errorMessage: string | null;
  handle: (error: unknown) => void;
  clearError: () => void;
}

/**
 * Custom hook for centralized error handling in React components.
 *
 * @returns {object} An object containing:
 * - `errorMessage`: The current user-friendly error message.
 * - `handle`: A function to handle and log errors.
 * - `clearError`: A function to reset the error state.
 */
const useErrorHandler = (): ErrorHandler => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Handles an error by logging it, wrapping it in an AppError if necessary,
   * and extracting a user-friendly message.
   *
   * @param {unknown} error - The error to handle. It can be of any type.
   */
  const handle = (error: unknown) => {
    try {
      const appError =
        error instanceof AppError
          ? error
          : AppError.create(
              ErrorType.UnknownError,
              mapErrorMessage(error),
              500,
              { details: error }
            );

      handleError(appError); // Log the error using a centralized logging utility
      setErrorMessage(appError.message); // Update error message state
    } catch (internalError) {
      console.error('Error in useErrorHandler:', internalError);
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  /**
   * Clears the current error message.
   */
  const clearError = () => setErrorMessage(null);

  return { errorMessage, handle, clearError };
};

export default useErrorHandler;
