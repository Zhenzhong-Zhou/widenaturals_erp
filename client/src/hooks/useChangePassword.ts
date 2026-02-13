import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectChangePasswordData,
  selectChangePasswordLoading,
  selectChangePasswordError,
  selectChangePasswordSuccess,
  selectChangePasswordChangedAt,
} from '@features/auth/password/state';
import {
  changePasswordThunk,
} from '@features/auth';
import {
  resetChangePasswordState
} from '@features/auth/password/state/changePasswordSlice';
import type {
  ChangePasswordRequest,
} from '@features/auth';

/**
 * React hook for authenticated password change workflow.
 *
 * Provides:
 * - success state
 * - loading state
 * - error state
 * - changed timestamp
 * - action dispatcher
 * - reset action
 *
 * Recommended usage:
 * - Account settings page
 * - Security settings dialog
 *
 * Does NOT handle redirect or logout automatically.
 * Caller must decide post-success behavior.
 */
const useChangePassword = () => {
  const dispatch = useAppDispatch();
  
  // ---------------------------
  // Selectors
  // ---------------------------
  
  const data = useAppSelector(selectChangePasswordData);
  const loading = useAppSelector(selectChangePasswordLoading);
  const error = useAppSelector(selectChangePasswordError);
  const success = useAppSelector(selectChangePasswordSuccess);
  const changedAt = useAppSelector(selectChangePasswordChangedAt);
  
  // ---------------------------
  // Actions
  // ---------------------------
  
  /**
   * Dispatch password change request.
   */
  const changePassword = useCallback(
    (payload: ChangePasswordRequest) => {
      dispatch(changePasswordThunk(payload));
    },
    [dispatch]
  );
  
  /**
   * Reset slice state.
   * Useful when:
   * - Leaving page
   * - Closing dialog
   * - After logout
   */
  const reset = useCallback(() => {
    dispatch(resetChangePasswordState());
  }, [dispatch]);
  
  return {
    data,
    loading,
    error,
    success,
    changedAt,
    
    changePassword,
    reset,
  };
};

export default useChangePassword;
