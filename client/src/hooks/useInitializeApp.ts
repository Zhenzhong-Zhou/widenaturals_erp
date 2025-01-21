import { useCallback, useEffect, useState } from 'react';
import { handleError, mapErrorMessage } from '../utils/errorUtils';
import { AppError, ErrorType } from '../utils/AppError';
import { csrfService } from '../services';
import { withTimeout } from '../utils/timeoutUtils';
import { withRetry } from '@utils/retryUtils.ts';
import { monitorCsrfStatus } from '@utils/monitorCsrfStatus.ts';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  selectCsrfStatus,
  selectCsrfError,
} from '../features/csrf/state/csrfSelector.ts';
import { resetCsrfToken } from '../features/csrf/state/csrfSlice.ts';

interface InitializeAppOptions {
  delay?: number; // Simulated delay (default: 2000ms)
  retryAttempts?: number; // Number of retry attempts (default: 3)
}

const useInitializeApp = ({
  delay = 500,
  retryAttempts = 3,
}: InitializeAppOptions = {}) => {
  const dispatch = useAppDispatch();
  const csrfStatus = useAppSelector(selectCsrfStatus); // CSRF loading status
  const csrfError = useAppSelector(selectCsrfError); // CSRF error

  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] =
    useState<AppError | null>(null);

  // Main initialization logic
  const initialize = useCallback(async () => {
    try {
      // Simulate delay for initialization tasks
      await withTimeout(
        new Promise((resolve) => setTimeout(resolve, delay)),
        1000,
        'Initialization timed out'
      );

      console.info('App initialization completed');
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : AppError.create(
              ErrorType.GlobalError,
              mapErrorMessage(error),
              500,
              { details: error }
            );

      handleError(appError);
      setInitializationError(appError);
      throw appError;
    }
  }, [delay]);

  // Retry logic
  const retryInitializeApp = useCallback(async () => {
    try {
      await withRetry(
        initialize,
        retryAttempts,
        1000,
        'Failed to initialize app after multiple attempts'
      );
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : AppError.create(
              ErrorType.GlobalError,
              'Failed to initialize app',
              500,
              { details: error }
            );

      console.error('Initialization retry failed:', appError);
      setInitializationError(appError);
      dispatch(resetCsrfToken());
      throw appError;
    }
  }, [initialize, retryAttempts, dispatch]);

  // Hook lifecycle
  useEffect(() => {
    (async () => {
      setIsInitializing(true);
      try {
        console.info('Starting app initialization...');
        await retryInitializeApp(); // Retry if initialization fails
        
        console.info('Performing CSRF initialization...');
        await csrfService.initializeCsrfToken(dispatch);
        
        console.info('Monitoring CSRF status...');
        monitorCsrfStatus(csrfStatus, csrfError);
        
        console.info('App initialized successfully');
      } catch (error) {
        const appError =
          error instanceof AppError
            ? error
            : AppError.create(
              ErrorType.GlobalError,
              'Error during app initialization',
              500,
              { details: error }
            );
        console.error('Initialization error:', appError);
        setInitializationError(appError);
      } finally {
        setIsInitializing(false);
      }
    })();
  }, [retryInitializeApp, monitorCsrfStatus]);
  
  return {
    isInitializing,
    hasError: Boolean(initializationError),
    initializationError,
  };
};

export default useInitializeApp;
