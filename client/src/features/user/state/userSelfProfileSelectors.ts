import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Root selector for the self user profile slice.
 */
const selectUserSelfProfileState = (state: RootState) =>
  state.userSelfProfile;

/**
 * Loading status for self profile.
 */
export const selectUserSelfProfileLoading = createSelector(
  [selectUserSelfProfileState],
  (state) => state.loading
);

/**
 * Error message for self profile fetch.
 */
export const selectUserSelfProfileError = createSelector(
  [selectUserSelfProfileState],
  (state) => state.error
);

/**
 * Raw self profile data.
 */
export const selectUserSelfProfile = createSelector(
  [selectUserSelfProfileState],
  (state) => state.data
);

/**
 * Self user full name (display name).
 */
export const selectSelfUserFullName = createSelector(
  selectUserSelfProfile,
  (profile) => profile?.fullName ?? null
);

/**
 * Self user email.
 */
export const selectSelfUserEmail = createSelector(
  selectUserSelfProfile,
  (profile) => profile?.email ?? null
);

/**
 * Whether the self profile is a system account.
 */
export const selectIsSelfSystemUser = createSelector(
  [selectUserSelfProfile],
  (profile) => Boolean(profile?.isSystem)
);

/**
 * Initial loading state (no data yet).
 */
export const selectIsSelfProfileLoadingEmpty = createSelector(
  [selectUserSelfProfileLoading, selectUserSelfProfile],
  (loading, data) => loading && !data
);
