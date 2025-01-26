import { useAppDispatch } from '../store/storeHooks';
import { useNavigate } from 'react-router-dom';
import { clearTokens } from '../utils/tokenManager';
import { logoutThunk } from '../features/session/state/sessionThunks';
import { useCallback, useState } from 'react';

/**
 * Custom hook for user logout.
 */
const useLogout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logout = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null); // Reset error state

    try {
      console.log('Logout initiated');

      // Perform API logout
      await dispatch(logoutThunk()).unwrap();

      // Clear client-side data
      clearTokens();
      localStorage.clear();
      sessionStorage.clear();

      console.log('Client data cleared. Redirecting to /login');
      navigate('/login');

      setIsLoading(false);
      return true; // Indicate success
    } catch (error: any) {
      console.error('Error during logout:', error);
      setError(error);
      setIsLoading(false);
      return false; // Indicate failure
    }
  }, [dispatch, navigate]);

  return { logout, isLoading, error };
};

export default useLogout;
