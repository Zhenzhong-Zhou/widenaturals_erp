import { useCallback, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import { refreshTokenThunk } from '@features/session/state/sessionThunks';
import {
  selectAccessToken,
  selectIsAuthenticated,
} from '@features/session/state/loginSelectors';
import { selectIsRefreshingSession } from '@features/session/state/refreshSessionSelectors';
import { isTokenValid } from '@utils/auth';

/**
 * Proactively refreshes the access token before expiration.
 *
 * Design principles:
 * - Proactive refresh ONLY (not reactive error handling)
 * - Silent operation (no UI, no logging)
 * - Login slice remains the single source of truth
 */
const useTokenRefresh = (): void => {
  const dispatch = useAppDispatch();
  
  // -----------------------------
  // Selectors
  // -----------------------------
  const accessToken = useAppSelector(selectAccessToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isRefreshing = useAppSelector(selectIsRefreshingSession);
  
  const refreshTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // -----------------------------
  // Refresh action
  // -----------------------------
  const refreshAccessToken = useCallback(async () => {
    if (isRefreshing) return;
    
    await dispatch(refreshTokenThunk()).unwrap();
  }, [dispatch, isRefreshing]);
  
  // -----------------------------
  // Scheduling logic
  // -----------------------------
  const scheduleRefresh = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return;
    
    // Token already invalid → refresh immediately
    if (!isTokenValid(accessToken)) {
      await refreshAccessToken();
      return;
    }
    
    try {
      const { exp } = jwtDecode<{ exp: number }>(accessToken);
      
      const expiresAt = exp * 1000;
      
      // Refresh 5 minutes before expiry
      const refreshAt =
        expiresAt - Date.now() - 5 * 60 * 1000;
      
      if (refreshAt <= 0) {
        await refreshAccessToken();
        return;
      }
      
      refreshTimeoutRef.current =
        setTimeout(refreshAccessToken, refreshAt);
    } catch {
      // Decoding failed → force refresh
      await refreshAccessToken();
    }
  }, [accessToken, isAuthenticated, refreshAccessToken]);
  
  // -----------------------------
  // Effect lifecycle
  // -----------------------------
  useEffect(() => {
    scheduleRefresh();
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [scheduleRefresh]);
};

export default useTokenRefresh;
