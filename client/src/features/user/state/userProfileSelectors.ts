import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store.ts';
import { UserProfileState } from '@features/user/state/userProfileSlice.ts';

/**
 * Base selector with type assertion to avoid TS18046.
 */
const selectUserProfileState = (state: RootState): UserProfileState =>
  state.userProfile as UserProfileState;

/**
 * Selects user profile response.
 */
export const selectUserProfileResponse = createSelector(
  selectUserProfileState,
  (state) => state.response
);

/**
 * Selects user profile loading state.
 */
export const selectUserProfileLoading = createSelector(
  selectUserProfileState,
  (state) => state.loading ?? false
);

/**
 * Selects user profile error.
 */
export const selectUserProfileError = createSelector(
  selectUserProfileState,
  (state) => state.error
);

/**
 * Memoized selector combining response, loading, and error.
 */
export const selectUserProfileData = createSelector(
  [
    selectUserProfileResponse,
    selectUserProfileLoading,
    selectUserProfileError,
  ],
  (response, loading, error) => ({
    response,
    loading,
    error,
  })
);
