import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectLoginData,
  selectLoginLoading,
  selectLoginError,
} from '@features/session/state/loginSelectors';
import { loginThunk } from '@features/session';
import type { LoginRequestBody } from '@features/session';

/**
 * Hook dedicated to login behavior and UI state.
 *
 * Responsibilities:
 * - Expose login async state (data, loading, error)
 * - Provide an action to trigger login
 *
 * Notes:
 * - Authentication state is owned by `session`
 * - This hook MUST NOT expose auth truth
 * - Safe for UI-only usage
 */
const useLogin = () => {
  const dispatch = useAppDispatch();
  
  // -----------------------------
  // Login UI state
  // -----------------------------
  const data = useAppSelector(selectLoginData);
  const loading = useAppSelector(selectLoginLoading);
  const error = useAppSelector(selectLoginError);
  
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
      data,
      loading,
      error,
      submit,
    }),
    [data, loading, error, submit]
  );
};

export default useLogin;
