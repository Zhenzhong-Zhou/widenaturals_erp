import { useCallback, useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';
import { handleError, mapErrorMessage } from '../utils/errorUtils';
import { AppError, ErrorType } from '../utils/AppError';
import { csrfService } from '../services';
import { withTimeout } from '../utils/timeoutUtils';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import { selectCsrfStatus, selectCsrfError } from '../features/csrf/state/csrfSelector.ts';
import { withRetry } from '@utils/retryUtils.ts';
import { monitorCsrfStatus } from '@utils/monitorCsrfStatus.ts';
import { resetCsrfToken } from '../features/csrf/state/csrfSlice.ts';

interface InitializeAppOptions {
  message?: string; // Custom loading message
  delay?: number;   // Simulated delay (default: 2000ms)
  retryAttempts?: number; // Number of retry attempts (default: 3)
}

export const useInitializeApp = ({
                                   message = 'Initializing application...',
                                   delay = 2000,
                                   retryAttempts = 3,
                                 }: InitializeAppOptions = {}) => {
  const { showLoading, hideLoading } = useLoading();
  const dispatch = useAppDispatch();
  const csrfStatus = useAppSelector(selectCsrfStatus); // CSRF loading status
  const csrfError = useAppSelector(selectCsrfError); // CSRF error
  
  // Main initialization logic
  const initialize = useCallback(async () => {
    try {
      showLoading(message);
      
      // Simulate delay for initialization tasks
      await withTimeout(
        new Promise((resolve) => setTimeout(resolve, delay)),
        10000,
        'Initialization timed out'
      );
      
      console.info('App initialization completed');
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : AppError.create(
          ErrorType.GlobalError,
          mapErrorMessage(error),
          500,
          { details: error }
        );
      handleError(appError);
      
      console.error(`Initialization error: ${appError.message}`);
      throw appError; // Re-throw for higher-level handling
    }
  }, [showLoading, message, delay]);
  
  // Retry logic for app initialization
  const retryInitializeApp = useCallback(async () => {
    try {
      await withRetry(initialize, retryAttempts, 'Failed to initialize app after multiple attempts');
    } catch (error) {
      const appError = error instanceof AppError
        ? error
        : AppError.create(ErrorType.GlobalError, 'Failed to initialize app', 500, { details: error });
      console.error('Initialization retry failed:', appError);
      dispatch(resetCsrfToken());
      throw appError; // Re-throw for higher-level handling
    }
  }, [initialize, retryAttempts, dispatch]);
  
  // Hook lifecycle
  useEffect(() => {
    (async () => {
      try {
        showLoading(message);
        
        // Retry initialization if it fails
        await retryInitializeApp();
        
        // Perform main initialization tasks
        await initialize();
        
        // Perform CSRF token initialization with dispatch
        await csrfService.initializeCsrfToken(dispatch);
        
        // Monitor CSRF token status and errors
        monitorCsrfStatus(csrfStatus, csrfError);
        
        console.info('Application initialized successfully');
      } catch (error) {
        const appError = error instanceof AppError
          ? error
          : AppError.create(
            ErrorType.GlobalError,
            'Error during app initialization',
            500,
            { details: error }
          );
        handleError(appError);
        console.error('Error during app initialization:', appError);
      } finally {
        hideLoading();
      }
    })();
  }, [initialize, retryInitializeApp, showLoading, hideLoading, message, monitorCsrfStatus]);
};
