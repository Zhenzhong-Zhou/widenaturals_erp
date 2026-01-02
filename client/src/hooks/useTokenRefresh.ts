import { useCallback, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import { refreshTokenThunk } from '@features/session/state/sessionThunks';
import { selectAccessToken } from '@features/session/state/sessionSelectors';
import { isTokenValid } from '@utils/auth';

/**
 * Proactively refreshes the access token before expiration.
 *
 * Design principles:
 * - Proactive refresh ONLY (not reactive error handling)
 * - Silent operation (no UI, no logging)
 * - Axios interceptors handle reactive refresh on 401
 */
const useTokenRefresh = (): void => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(selectAccessToken);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Dispatch refresh thunk (single responsibility).
   */
  const refreshAccessToken = useCallback(async () => {
    await dispatch(refreshTokenThunk()).unwrap();
  }, [dispatch]);

  /**
   * Schedule refresh based on token expiry.
   */
  const scheduleRefresh = useCallback(async () => {
    if (!accessToken) return;

    // If token already invalid → refresh immediately
    if (!isTokenValid(accessToken)) {
      await refreshAccessToken();
      return;
    }

    try {
      const { exp } = jwtDecode<{ exp: number }>(accessToken);

      // JWT exp is seconds
      const expiresAt = exp * 1000;

      // Refresh 5 minutes before expiry
      const refreshAt = expiresAt - Date.now() - 5 * 60 * 1000;

      if (refreshAt <= 0) {
        await refreshAccessToken();
        return;
      }

      refreshTimeoutRef.current = setTimeout(refreshAccessToken, refreshAt);
    } catch {
      // Decoding failed → force refresh
      await refreshAccessToken();
    }
  }, [accessToken, refreshAccessToken]);

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
