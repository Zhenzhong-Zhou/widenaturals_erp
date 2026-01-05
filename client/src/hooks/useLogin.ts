import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectLoginData,
  selectLoginLoading,
  selectLoginError,
  selectIsAuthenticated,
} from '@features/session/state/loginSelectors';
import { loginThunk } from '@features/session';
import type { LoginRequestBody } from '@features/session';

/**
 * Hook dedicated to login behavior and UI state.
 *
 * Responsibilities:
 * - Expose login async state (data, loading, error)
 * - Expose derived authentication status
 * - Provide actions to trigger login and reset login state
 *
 * Notes:
 * - Authentication side effects (tokens, headers, cookies)
 *   are handled outside Redux and are intentionally not exposed here.
 * - This hook is UI-focused and safe to use in any component.
 */
const useLogin = () => {
  const dispatch = useAppDispatch();
  
  // -----------------------------
  // Selectors
  // -----------------------------
  const data = useAppSelector(selectLoginData);
  const loading = useAppSelector(selectLoginLoading);
  const error = useAppSelector(selectLoginError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  // -----------------------------
  // Login action
  // -----------------------------
  const submit = useCallback(
    (credentials: LoginRequestBody) => {
      return dispatch(loginThunk(credentials));
    },
    [dispatch]
  );
  
  // -----------------------------
  // Memoized API
  // -----------------------------
  return useMemo(
    () => ({
      // state
      data,
      loading,
      error,
      isAuthenticated,
      
      // actions
      submit,
    }),
    [data, loading, error, isAuthenticated, submit]
  );
};

export default useLogin;
