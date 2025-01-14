import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import {
  selectIsAuthenticated,
  selectUser,
} from '../features/auth/state/authSelectors';
import { loginSuccess, logout as logoutAction } from '../features/auth/state/authSlice';
import { refreshToken as refreshTokenService } from '../services/authenticateService.ts';

const useAuth = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  
  // Login Function
  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        
        if (!response.ok) {
          throw new Error('Login failed');
        }
        
        const data = await response.json();
        dispatch(loginSuccess({ user: data.user, tokens: data.tokens }));
      } catch (error) {
        console.error('Login error:', error);
      }
    },
    [dispatch]
  );
  
  // Logout Function
  const logout = useCallback(() => {
    dispatch(logoutAction());
  }, [dispatch]);
  
  // Refresh Token Function
  const refreshToken = useCallback(async () => {
    try {
      const newTokens = await refreshTokenService(); // No argument needed
      dispatch(
        loginSuccess({
          user, // Preserve the current user state
          tokens: newTokens,
        })
      );
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout(); // Logout if refresh fails
    }
  }, [dispatch, user, logout]);
  
  return {
    isAuthenticated,
    user,
    login,
    logout,
    refreshToken,
  };
};

export default useAuth;
