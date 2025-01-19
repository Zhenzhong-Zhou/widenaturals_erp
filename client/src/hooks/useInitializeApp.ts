import { useCallback, useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';
import { handleError, mapErrorMessage } from '../utils/errorUtils';
import { AppError, ErrorType } from '../utils/AppError';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import { getCsrfTokenThunk } from '../features/csrf/state/csrfThunk.ts';
import { selectCsrfStatus } from '../features/csrf/state/csrfSelector.ts';

interface InitializeAppOptions {
  message?: string; // Custom loading message
  delay?: number;   // Simulated delay (default: 2000ms)
}

export const useInitializeApp = ({
                                   message = 'Initializing application...',
                                   delay = 2000,
                                 }: InitializeAppOptions = {}) => {
  const { showLoading, hideLoading } = useLoading();
  const dispatch = useAppDispatch();
  const csrfStatus = useAppSelector(selectCsrfStatus);
  
  // Utility to handle timeouts
  const withTimeout = useCallback(
    (promise: Promise<void>, timeout: number) =>
      Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => {
            reject(
              AppError.create(ErrorType.TimeoutError, 'Initialization timed out', 408, { timeout })
            );
          }, timeout)
        ),
      ]),
    []
  );
  
  // Initialize CSRF Token
  // todo add retry and make more modular
  const initializeCsrfToken = useCallback(async () => {
    let attempts = 3; // Retry up to 3 times
    while (attempts > 0) {
      try {
        if (csrfStatus === 'idle') {
          await dispatch(getCsrfTokenThunk()).unwrap();
          console.info('CSRF token initialized successfully');
        }
        return;
      } catch (error) {
        console.warn(
          `CSRF token initialization failed. Attempts remaining: ${attempts - 1}`,
          error
        );
        attempts -= 1;
        if (attempts === 0) {
          throw AppError.create(
            ErrorType.GlobalError,
            'Failed to initialize CSRF token',
            500,
            error instanceof Error ? { message: error.message } : undefined
          );
        }
      }
    }
  }, [dispatch, csrfStatus]);
  
  // Main initialization logic
  const initialize = useCallback(async () => {
    try {
      showLoading(message);
      
      // Simulate delay for initialization tasks
      await withTimeout(
        new Promise((resolve) => setTimeout(resolve, delay)),
        10000 // 10s timeout
      );
      
      console.info('App initialization completed');
    } catch (error) {
      const appError = error instanceof AppError ? error : AppError.create(
        ErrorType.GlobalError,
        mapErrorMessage(error),
        500,
        { details: error }
      );
      handleError(appError);
      
      const userMessage = mapErrorMessage(error);
      console.error(`Initialization error: ${userMessage}`);
      
      throw appError; // Re-throw for higher-level handling
    }
  }, [showLoading, message, delay, withTimeout]);
  
  // Hook lifecycle
  useEffect(() => {
    (async () => {
      try {
        showLoading(message);
        
        // Perform main initialization tasks
        await initialize();
        
        // Perform CSRF token initialization
        await initializeCsrfToken();
        
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
  }, [initialize, initializeCsrfToken, showLoading, hideLoading, message]);
};
