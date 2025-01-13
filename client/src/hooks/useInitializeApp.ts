import { useCallback, useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';
import { handleError, mapErrorMessage } from '../utils/errorUtils';
import AppError from '../utils/AppError';

interface InitializeAppOptions {
  message?: string; // Custom loading message
  delay?: number;   // Simulated delay (default: 2000ms)
}

export const useInitializeApp = ({
                                   message = 'Initializing application...',
                                   delay = 2000,
                                 }: InitializeAppOptions = {}) => {
  const { showLoading, hideLoading } = useLoading();
  
  const initialize = useCallback(async () => {
    try {
      showLoading(message);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      // Use handleError to log and process the error
      handleError(error);
      
      // Optionally, throw an AppError or log a message for UI
      const userMessage = mapErrorMessage(error);
      console.error(`Initialization error: ${userMessage}`);
      
      throw new AppError(userMessage, 500, 'GlobalError');
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
