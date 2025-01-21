import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import { refreshTokenThunk } from '../features/session';
import { selectAccessToken } from '../features/session/state/sessionSelectors';
import { isTokenValid } from '../utils/tokenValidationUtils.ts';

const useTokenRefresh = () => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  
  useEffect(() => {
    let refreshTimeout: number | null = null;
    
    const scheduleTokenRefresh = () => {
      if (accessToken) {
        try {
          // Check if the token is valid
          if (!isTokenValid(accessToken)) {
            console.warn('Access token is invalid or expired. Refreshing immediately.');
            dispatch(refreshTokenThunk());
            return;
          }
          
          // Decode the token to get the expiration time
          const decoded: { exp: number } = jwtDecode(accessToken);
          const expiryTime = decoded.exp * 1000; // Convert to milliseconds
          const refreshTime = expiryTime - Date.now() - 5 * 60 * 1000; // Refresh 5 minutes before expiry
          
          if (refreshTime > 0) {
            // Schedule token refresh
            refreshTimeout = setTimeout(() => {
              dispatch(refreshTokenThunk());
            }, refreshTime);
          } else {
            // Token is near expiry, refresh immediately
            dispatch(refreshTokenThunk());
          }
        } catch (error) {
          console.error('Error scheduling token refresh:', error);
        }
      }
    };
    
    scheduleTokenRefresh();
    
    // Cleanup the timeout when the accessToken changes or the component unmounts
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [accessToken, dispatch]);
};

export default useTokenRefresh;
