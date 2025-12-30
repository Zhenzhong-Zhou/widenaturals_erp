import { useState } from 'react';
import {
  AppError,
  ErrorType,
  handleError,
  mapErrorMessage
} from '@utils/error';

interface ErrorHandler {
  errorMessage: string | null;
  handle: (error: unknown) => void;
  clearError: () => void;
}

/**
 * UI-only hook for recoverable, non-fatal errors.
 *
 * Responsibilities:
 * - Normalize unknown errors into AppError (if needed)
 * - Delegate logging/reporting to centralized handler
 * - Expose a user-facing message for inline UI display
 *
 * IMPORTANT:
 * - Component-level errors ONLY
 * - Must NOT replace Error Boundaries
 * - Must NOT be used for navigation, auth, or module failures
 */
const useErrorHandler = (): ErrorHandler => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handle = (error: unknown) => {
    const appError =
      error instanceof AppError
        ? error
        : new AppError('A recoverable error occurred', {
          type: ErrorType.Unknown,
          cause: error,
        });
    
    // Centralized logging / reporting
    handleError(appError);
    
    // UI-safe message extraction (last step only)
    setErrorMessage(mapErrorMessage(appError));
  };
  
  const clearError = () => {
    setErrorMessage(null);
  };
  
  return {
    errorMessage,
    handle,
    clearError,
  };
};

export default useErrorHandler;
