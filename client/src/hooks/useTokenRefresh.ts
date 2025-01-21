import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import { refreshTokenThunk } from '../features/session';
import { selectAccessToken } from '../features/session/state/sessionSelectors';
import { isTokenValid } from '../utils/tokenValidationUtils';

const useTokenRefresh = () => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  
  useEffect(() => {
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const scheduleTokenRefresh = () => {
      if (!accessToken) return;
      
      try {
        if (!isTokenValid(accessToken)) {
          console.warn('Access token is invalid or expired. Refreshing immediately.');
          dispatch(refreshTokenThunk());
          return;
        }
        
        // Decode token to get expiration time
        const decoded: { exp: number } = jwtDecode(accessToken);
        const expiryTime = decoded.exp * 1000; // Convert to milliseconds
        const refreshTime = expiryTime - Date.now() - 5 * 60 * 1000; // Refresh 5 minutes before expiry
        
        if (refreshTime > 0) {
          refreshTimeout = setTimeout(() => {
            console.log('Refreshing access token...');
            dispatch(refreshTokenThunk());
          }, refreshTime);
        } else {
          console.warn('Token near expiry. Refreshing immediately.');
          dispatch(refreshTokenThunk());
        }
      } catch (error) {
        console.error('Error decoding token or scheduling refresh:', error);
      }
    };
    
    scheduleTokenRefresh();
    
    // Cleanup the timeout when the accessToken changes or the component unmounts
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
        refreshTimeout = null;
      }
    };
  }, [accessToken, dispatch]);
};

export default useTokenRefresh;
