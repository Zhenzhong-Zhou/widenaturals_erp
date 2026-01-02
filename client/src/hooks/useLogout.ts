import { useCallback, useState } from 'react';
import { useAppDispatch } from '@store/storeHooks';
import { clearTokens } from '@utils/auth';
import { logoutThunk } from '@features/session/state/sessionThunks';

/**
 * Custom hook for user logout.
 */
const useLogout = () => {
  const dispatch = useAppDispatch();

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const logout = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null); // Reset error state

    try {
      console.log('Logout initiated...');

      // Attempt API logout
      try {
        await dispatch(logoutThunk()).unwrap();
      } catch (error) {
        console.warn(
          'Logout request failed or session already invalid:',
          error
        );
        // Proceed with clearing session regardless
      }

      // Clear client-side tokens
      clearTokens();
      localStorage.clear();
      sessionStorage.clear();

      console.log('Client data cleared. Redirecting to /login');

      setIsLoading(false);

      // Ensure the page fully reloads to prevent stale session data
      window.location.href = '/login';

      return true; // Indicate success
    } catch (error: any) {
      console.error('Error during logout:', error);
      setError(error);
      setIsLoading(false);
      return false; // Indicate failure
    }
  }, [dispatch]);

  return { logout, isLoading, error };
};

export default useLogout;
