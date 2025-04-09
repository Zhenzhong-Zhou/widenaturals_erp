import { useCallback, useEffect, useState } from 'react';
import { handleError, mapErrorMessage } from '@utils/errorUtils';
import { AppError, ErrorType } from '@utils/AppError';
import { withTimeout } from '@utils/timeoutUtils';
import { withRetry } from '@utils/retryUtils.ts';
import { csrfService } from '@services/csrfService';
import { monitorCsrfStatus } from '@utils/monitorCsrfStatus.ts';
import { selectCsrfStatus, selectCsrfError } from '@features/csrf/state/csrfSelector';
import { resetCsrfToken } from '@features/csrf/state/csrfSlice';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';

interface InitializeAppOptions {
  delay?: number; // Simulated delay (default: 500ms)
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

  const initializeCsrfToken = useCallback(async () => {
    try {
      await csrfService.initializeCsrfToken(dispatch);
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error);
      throw error;
    }
  }, [dispatch]);

  const initialize = useCallback(async () => {
    try {
      // Simulate initialization delay
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
      dispatch(resetCsrfToken());
      throw appError;
    }
  }, [delay, dispatch]);

  useEffect(() => {
    const initializeApp = async () => {
      setIsInitializing(true);
      try {
        console.info('Starting app initialization...');

        // Step 1: Fetch and initialize CSRF token
        console.info('Fetching CSRF token...');
        await withRetry(
          initializeCsrfToken,
          retryAttempts,
          1000,
          'Failed to fetch CSRF token after multiple attempts'
        );

        // Step 2: Monitor CSRF status (after successful token initialization)
        console.info('Monitoring CSRF status...');
        monitorCsrfStatus(csrfStatus, csrfError);

        // Step 3: General app initialization
        console.info('Initializing app...');
        await initialize();

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
    };

    initializeApp().catch();
  }, [
    dispatch,
    csrfStatus,
    csrfError,
    initializeCsrfToken,
    initialize,
    retryAttempts,
  ]);

  return {
    isInitializing,
    hasError: Boolean(initializationError),
    initializationError,
  };
};

export default useInitializeApp;
