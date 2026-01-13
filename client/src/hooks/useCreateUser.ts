import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectCreateUserData,
  selectCreateUserLoading,
  selectCreateUserError,
  selectCreateUserSuccess,
  selectCreateUserShouldReset,
  createUserThunk,
} from '@features/user';
import type { CreateUserRequest } from '@features/user';
import { resetCreateUserState } from '@features/user/state/createUserSlice';

/**
 * useCreateUser
 *
 * Custom hook for interacting with the create-user mutation flow.
 *
 * Responsibilities:
 * - Expose create-user async state (loading, error, success, data)
 * - Provide a typed, memoized submit handler
 * - Provide a reset helper for UI and form cleanup
 *
 * MUST NOT:
 * - Contain business or domain logic
 * - Perform validation
 * - Transform response data
 */
const useCreateUser = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectCreateUserData);
  const loading = useAppSelector(selectCreateUserLoading);
  const error = useAppSelector(selectCreateUserError);
  const success = useAppSelector(selectCreateUserSuccess);
  const shouldReset = useAppSelector(selectCreateUserShouldReset);
  
  /**
   * Dispatches the thunk to create a user.
   *
   * @param payload CreateUserRequest
   */
  const createUser = useCallback(
    async (payload: CreateUserRequest) => {
      return dispatch(createUserThunk(payload));
    },
    [dispatch]
  );
  
  /**
   * Resets the create-user state to its initial value.
   *
   * Intended for:
   * - Form unmount
   * - Post-success cleanup
   * - Retry flows
   */
  const resetCreateUser = useCallback(() => {
    dispatch(resetCreateUserState());
  }, [dispatch]);
  
  return {
    data,
    loading,
    error,
    success,
    shouldReset,
    createUser,
    resetCreateUser,
  };
};

export default useCreateUser;
