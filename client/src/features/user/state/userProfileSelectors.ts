import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';
import { UserProfileResponse } from './userTypes';

export const selectUserProfileResponse = (
  state: RootState
): UserProfileResponse | null => state.userProfile.response;

export const selectUserProfileLoading = (state: RootState): boolean =>
  state.userProfile.loading ?? false;

export const selectUserProfileError = (state: RootState) =>
  state.userProfile.error;

// Memoized Selector (Combining Selectors)
export const selectUserProfileData = createSelector(
  [selectUserProfileResponse, selectUserProfileLoading, selectUserProfileError],
  (response, loading, error) => ({
    response,
    loading,
    error,
  })
);
