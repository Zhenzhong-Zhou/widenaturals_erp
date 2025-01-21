import { useCallback, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import { refreshTokenThunk } from '../features/session';
import { selectAccessToken } from '../features/session/state/sessionSelectors';
import { isTokenValid } from '../utils/tokenValidationUtils';
import axiosInstance from '@utils/axiosConfig.ts';

const useTokenRefresh = () => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  const refreshTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Refresh tokens and update Axios headers
  const refreshTokens = useCallback(async () => {
    try {
      const { accessToken: newAccessToken, csrfToken: newCsrfToken } = await dispatch(refreshTokenThunk()).unwrap();
      
      // Update Axios headers with refreshed tokens
      axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
      axiosInstance.defaults.headers['X-CSRF-Token'] = newCsrfToken;
      
      console.log('Tokens refreshed successfully.');
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      // Handle token refresh failure (e.g., logout or show an error)
    }
  }, [dispatch]);
  
  // Schedule token refresh
  const scheduleTokenRefresh = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      if (!isTokenValid(accessToken)) {
        console.warn('Access token is invalid or expired. Refreshing immediately.');
        await refreshTokens();
        return;
      }
      
      // Decode token to get expiration time
      const decoded: { exp: number } = jwtDecode(accessToken);
      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      const refreshTime = expiryTime - Date.now() - 5 * 60 * 1000; // Refresh 5 minutes before expiry
      
      if (refreshTime > 0) {
        refreshTimeout.current = setTimeout(async () => {
          console.log('Refreshing access token...');
          await refreshTokens();
        }, refreshTime);
      } else {
        console.warn('Token near expiry. Refreshing immediately.');
        await refreshTokens();
      }
    } catch (error) {
      console.error('Error decoding token or scheduling refresh:', error);
    }
  }, [accessToken, refreshTokens]);
  
  useEffect(() => {
    (async () => {
      try {
        await scheduleTokenRefresh();
      } catch (err) {
        console.error('Error during token scheduling:', err);
      }
    })();
    
    // Cleanup the timeout when the accessToken changes or the component unmounts
    return () => {
      if (refreshTimeout.current) {
        clearTimeout(refreshTimeout.current);
        refreshTimeout.current = null;
      }
    };
  }, [accessToken, scheduleTokenRefresh]);
};

export default useTokenRefresh;
