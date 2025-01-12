import { useCallback, useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';

interface InitializeAppOptions {
  message?: string; // Custom loading message
  delay?: number;   // Simulated delay (default: 2000ms)
}

export const useInitializeApp = ({ message = 'Initializing application...', delay = 2000 }: InitializeAppOptions = {}) => {
  const { showLoading, hideLoading } = useLoading();
  
  const initialize = useCallback(async () => {
    try {
      showLoading(message);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.error('Initialization error:', error);
      // Optional: reportErrorToService(error);
    } finally {
      hideLoading();
    }
  }, [showLoading, hideLoading, message, delay]);
  
  useEffect(() => {
    (async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    })();
  }, [initialize]);
};
