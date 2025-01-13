import { useState } from 'react';
import { handleError, mapErrorMessage } from '../utils/errorUtils';

export const useErrorHandler = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handle = (error: unknown) => {
    handleError(error); // Log the error
    const userFriendlyMessage = mapErrorMessage(error);
    setErrorMessage(userFriendlyMessage);
  };
  
  const clearError = () => setErrorMessage(null);
  
  return { errorMessage, handle, clearError };
};

export default useErrorHandler;
