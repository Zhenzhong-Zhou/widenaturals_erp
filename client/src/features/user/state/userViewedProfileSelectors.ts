import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Root selector for the viewed user profile slice.
 */
const selectUserViewedProfileState= (state: RootState) =>
  selectRuntime(state).userViewedProfile;

/**
 * Loading status for viewed profile.
 */
export const selectUserViewedProfileLoading = createSelector(
  [selectUserViewedProfileState],
  (state) => state.loading
);

/**
 * Error message for viewed profile fetch.
 */
export const selectUserViewedProfileError = createSelector(
  [selectUserViewedProfileState],
  (state) => state.error
);

/**
 * Raw viewed user profile data.
 */
export const selectUserViewedProfile = createSelector(
  [selectUserViewedProfileState],
  (state) => state.data
);

/**
 * Viewed user's full name.
 */
export const selectViewedUserFullName = createSelector(
  selectUserViewedProfile,
  (profile) => profile?.fullName ?? null
);

/**
 * Viewed user's email.
 */
export const selectViewedUserEmail = createSelector(
  selectUserViewedProfile,
  (profile) => profile?.email ?? null
);

/**
 * Whether the viewed user is a system-level account.
 */
export const selectIsViewedSystemUser = createSelector(
  [selectUserViewedProfile],
  (profile) => Boolean(profile?.isSystem)
);

/**
 * ID of the user currently being viewed.
 */
export const selectViewedUserId = createSelector(
  [selectUserViewedProfileState],
  (state) => state.viewedUserId
);

/**
 * Initial loading state (no data yet).
 */
export const selectIsViewedProfileLoadingEmpty = createSelector(
  [selectUserViewedProfileLoading, selectUserViewedProfile],
  (loading, data) => loading && !data
);
