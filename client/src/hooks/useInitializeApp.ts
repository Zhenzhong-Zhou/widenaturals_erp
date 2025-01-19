import { useCallback, useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';
import { handleError, mapErrorMessage } from '../utils/errorUtils';
import AppError from '../utils/AppError';
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
          setTimeout(() => reject(new AppError('Initialization timed out', 408, { type: 'TimeoutError' })), timeout)
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
        console.info('CSRF token initialized successfully');
        return;
      } catch (error) {
        console.warn(`CSRF token initialization failed. Attempts remaining: ${attempts - 1}`, error);
        attempts -= 1;
        if (attempts === 0) throw new AppError('Failed to initialize CSRF token', 500, { type: 'GlobalError' });
      }
    }
  }, [dispatch]);
  
  // Main initialization logic
  const initialize = useCallback(async () => {
    try {
      showLoading(message);
      
      // Simulate delay for initialization tasks
      await withTimeout(new Promise((resolve) => setTimeout(resolve, delay)), 10000); // 10s timeout
      
      console.info('App initialization completed');
    } catch (error) {
      handleError(error);
      
      const userMessage = mapErrorMessage(error);
      console.error(`Initialization error: ${userMessage}`);
      
      throw new AppError(userMessage, 500, { type: 'GlobalError' });
    }
  }, [showLoading, message, delay, withTimeout]);
  
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
        handleError(error);
        console.error('Error during app initialization:', error);
      } finally {
        hideLoading();
      }
    })();
  }, [initialize, initializeCsrfToken, showLoading, hideLoading, message]);
};
