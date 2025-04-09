import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectAccessToken,
  selectIsAuthenticated,
  selectUser,
} from '@features/session/state/sessionSelectors';
import { selectCsrfToken } from '@features/csrf/state/csrfSelector';
import { refreshTokenThunk } from '@features/session/state/sessionThunks';
import axiosInstance from '@utils/axiosConfig';

/**
 * Custom hook for session management.
 * Focuses on login status, token synchronization, and token refreshing.
 */
const useSession = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const accessToken = useAppSelector(selectAccessToken);
  const csrfToken = useAppSelector(selectCsrfToken);

  /**
   * Refresh the tokens (accessToken and csrfToken).
   * Updates the Redux state and Axios instance headers.
   */
  const refreshToken = useCallback(async () => {
    try {
      // Dispatch the refreshTokenThunk and unwrap its result
      const { accessToken: newAccessToken, csrfToken: newCsrfToken } =
        await dispatch(refreshTokenThunk()).unwrap();

      console.log('Tokens refreshed successfully.');

      // Update Axios instance with the new tokens
      axiosInstance.defaults.headers.Authorization = `Bearer ${newAccessToken}`;
      axiosInstance.defaults.headers['X-CSRF-Token'] = newCsrfToken;

      return { accessToken: newAccessToken, csrfToken: newCsrfToken };
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Synchronize the current accessToken and csrfToken with Axios on token change.
   */
  useEffect(() => {
    // Sync accessToken
    if (accessToken) {
      axiosInstance.defaults.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      delete axiosInstance.defaults.headers.Authorization;
    }

    // Sync csrfToken
    if (csrfToken) {
      axiosInstance.defaults.headers['X-CSRF-Token'] = csrfToken;
    } else {
      delete axiosInstance.defaults.headers['X-CSRF-Token'];
    }
  }, [accessToken, csrfToken]);

  // Return the session state and actions
  return {
    isAuthenticated,
    user,
    accessToken,
    csrfToken,
    refreshToken,
  };
};

export default useSession;
