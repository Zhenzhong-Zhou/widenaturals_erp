import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  selectAccessToken,
  selectIsAuthenticated,
  selectUser,
} from '../features/session/state/sessionSelectors.ts';
import { refreshTokenThunk } from '../features/session';

/**
 * Custom hook for session management.
 * Focuses on login status and token refreshing.
 */
const useSession = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const accessToken = useAppSelector(selectAccessToken);

  /**
   * Refresh the access token.
   * This function handles calling the refresh token logic
   * and returns the updated token.
   */
  const refreshToken = useCallback(async () => {
    try {
      // Dispatch the refreshTokenThunk and unwrap its result
      return await dispatch(refreshTokenThunk()).unwrap();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error; // Re-throw the error for the caller to handle
    }
  }, [dispatch]);

  // Return the session state and actions
  return {
    isAuthenticated,
    user,
    accessToken,
    refreshToken,
  };
};

export default useSession;
