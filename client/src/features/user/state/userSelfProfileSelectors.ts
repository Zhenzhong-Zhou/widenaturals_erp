import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Root selector for the self user profile slice.
 */
const selectUserSelfProfileState= (state: RootState) =>
  selectRuntime(state).userSelfProfile;

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

/**
 * Selector: indicates whether the authenticated user's
 * self profile has been loaded.
 *
 * Returns `true` when profile data exists in the store,
 * and `false` when:
 * - the user is not authenticated
 * - the profile has not been fetched yet
 * - the profile was cleared during logout
 *
 * This selector is intentionally derived to:
 * - provide a stable boolean for effect guards
 * - prevent duplicate or premature profile fetches
 * - avoid inline selector logic inside components or hooks
 *
 * Common use cases:
 * - guarding auto-fetch hooks (e.g. `useUserSelfProfileAuto`)
 * - conditional rendering based on profile readiness
 *
 * Note:
 * - This selector does NOT imply authentication validity
 * - Authentication state must be checked separately
 */
export const selectHasSelfUserProfile = createSelector(
  [selectUserSelfProfile],
  (profile) => Boolean(profile)
);
