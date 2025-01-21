import { refreshTokenThunk } from '../features/session';
import { updateCsrfToken } from '../features/csrf/state/csrfSlice';
import { isTokenValid } from '../utils/tokenValidationUtils';
import { logoutThunk } from '../features/session/state/sessionThunks';
import axiosInstance from '../utils/axiosConfig';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import { selectAccessToken } from '../features/session/state/sessionSelectors.ts';
import { selectCsrfToken } from '../features/csrf/state/csrfSelector';
import { useCallback, useEffect, useState } from 'react';

interface UseValidateAndRefreshTokenResult {
  loading: boolean;
  error: string | null;
}

export const useValidateAndRefreshToken = (): UseValidateAndRefreshTokenResult => {
  const dispatch = useAppDispatch();
  const accessToken: string | null = useAppSelector(selectAccessToken);
  const csrfToken: string | null = useAppSelector(selectCsrfToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const validateAndRefreshToken = useCallback(async () => {
    if (!accessToken) {
      console.log('No access token available. Skipping token validation.');
      
      // Synchronize CSRF token if available
      if (csrfToken) {
        axiosInstance.defaults.headers['X-CSRF-Token'] = csrfToken;
      }
      
      return; // Skip further token validation
    }
    
    if (!isTokenValid(accessToken)) {
      console.warn('Access token is invalid. Attempting to refresh...');
      setLoading(true);
      try {
        // Refresh tokens
        const { accessToken: newAccessToken, csrfToken: newCsrfToken } = await dispatch(refreshTokenThunk()).unwrap();
        
        console.log('Access token refreshed successfully.');
        
        // Update CSRF token in Redux and Axios
        dispatch(updateCsrfToken(newCsrfToken));
        axiosInstance.defaults.headers['X-CSRF-Token'] = newCsrfToken;
        axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
        
        setError(null); // Clear previous errors
      } catch (error) {
        console.error('Failed to refresh token:', error);
        setError('Failed to refresh token.');
        await dispatch(logoutThunk()).unwrap(); // Clear session if refresh fails
      } finally {
        setLoading(false);
      }
    } else {
      console.log('Access token is valid.');
      
      // Synchronize CSRF token if available
      if (csrfToken) {
        axiosInstance.defaults.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
  }, [accessToken, csrfToken, dispatch]);
  
  useEffect(() => {
    (async () => {
      try {
        await validateAndRefreshToken();
      } catch (err) {
        console.error('Error during token validation and refresh:', err);
      }
    })();
  }, [validateAndRefreshToken]);
  
  return { loading, error };
};

export default useValidateAndRefreshToken;
