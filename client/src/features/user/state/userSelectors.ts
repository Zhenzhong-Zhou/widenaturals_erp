import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store.ts';
import { UsersState } from './userTypes'; // make sure UsersState is defined

/**
 * Base selector for the users slice.
 * Type assertion ensures correct type inference.
 */
const selectUsersState = (state: RootState): UsersState =>
  state.users as UsersState;

/**
 * Selects the array of user data.
 */
export const selectUsers = createSelector(
  selectUsersState,
  (state) => state.users
);

/**
 * Selects the loading status of users.
 */
export const selectUsersLoading = createSelector(
  selectUsersState,
  (state) => state.loading
);

/**
 * Selects the error message related to users.
 */
export const selectUsersError = createSelector(
  selectUsersState,
  (state) => state.error
);

/**
 * Combines user data, loading, and error state into one object.
 */
export const selectUsersData = createSelector(
  [selectUsers, selectUsersLoading, selectUsersError],
  (users, loading, error) => ({
    users,
    loading,
    error,
  })
);
