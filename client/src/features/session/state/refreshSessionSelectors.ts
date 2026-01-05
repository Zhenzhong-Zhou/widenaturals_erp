import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { RefreshTokenResponseData } from '@features/session';

/**
 * Base selector — retrieves the full `refreshSession` slice.
 *
 * This exposes the entire async state object and is typically
 * consumed by more granular selectors below.
 */
const selectRefreshSessionState = (state: RootState) =>
  state.refreshSession;

/**
 * Selector: indicates whether a refresh operation is in progress.
 */
export const selectRefreshSessionLoading = createSelector(
  [selectRefreshSessionState],
  (state) => state.loading
);

/**
 * Selector: returns the refresh session error (if any).
 */
export const selectRefreshSessionError = createSelector(
  [selectRefreshSessionState],
  (state) => state.error
);

/**
 * Selector: returns the refresh session response data (if any).
 *
 * This is for debugging / observability only.
 * DO NOT use this as an auth source of truth.
 */
export const selectRefreshSessionData = createSelector<
  [typeof selectRefreshSessionState],
  RefreshTokenResponseData | null
>(
  [selectRefreshSessionState],
  (state) => state.data
);

/**
 * Derived selector: returns `true` if a refresh attempt is active.
 *
 * Useful for gating UI interactions or preventing
 * concurrent refresh attempts.
 */
export const selectIsRefreshingSession = createSelector(
  [selectRefreshSessionLoading],
  (loading) => loading
);
