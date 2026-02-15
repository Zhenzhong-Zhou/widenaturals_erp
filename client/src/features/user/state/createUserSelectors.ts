import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the create-user state slice.
 *
 * Responsibilities:
 * - Extract the create-user state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - Internal implementation detail
 * - Prevents identity-selector warnings
 */
const selectCreateUserState = (state: RootState) =>
  selectRuntime(state).createUser;

/**
 * Selects the newly created user data.
 *
 * Semantics:
 * - `null`: no submission yet or state has been reset
 * - non-null: user was successfully created
 */
export const selectCreateUserData = createSelector(
  [selectCreateUserState],
  (state) => state.data
);

/**
 * Selects whether the create-user request is currently in progress.
 *
 * Useful for:
 * - Disabling submit buttons
 * - Showing loading indicators
 */
export const selectCreateUserLoading = createSelector(
  [selectCreateUserState],
  (state) => state.loading
);

/**
 * Selects any UI-safe error message from the create-user request.
 */
export const selectCreateUserError = createSelector(
  [selectCreateUserState],
  (state) => state.error
);

/**
 * Determines whether the create-user operation completed successfully.
 *
 * Returns `true` only when:
 * - The request is not loading
 * - No error is present
 * - Created user data exists
 *
 * Intended for:
 * - Post-create redirects
 * - Success notifications
 * - Follow-up workflows
 */
export const selectCreateUserSuccess = createSelector(
  [selectCreateUserData, selectCreateUserLoading, selectCreateUserError],
  (data, loading, error) => !loading && !error && data !== null
);
