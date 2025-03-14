import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store.ts';
import { UseUsersResponse } from './userTypes';

// Base selectors
export const selectUsers = (state: RootState): UseUsersResponse =>
  state.users.users;

export const selectUsersLoading = (state: RootState): boolean =>
  state.users.loading;

export const selectUsersError = (state: RootState): string | null =>
  state.users.error;

// Memoized Selector (Combining Selectors)
export const selectUsersData = createSelector(
  [selectUsers, selectUsersLoading, selectUsersError],
  (users, loading, error) => ({
    users,
    loading,
    error,
  })
);
