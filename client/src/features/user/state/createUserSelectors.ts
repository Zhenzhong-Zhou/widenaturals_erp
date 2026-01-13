import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the create-user mutation slice.
 *
 * Extracts the entire `createUser` async state from the runtime store.
 *
 * This slice represents a WRITE operation (POST /users),
 * not cached or queryable user data.
 */
export const selectCreateUserState = createSelector(
  [selectRuntime],
  (runtime) => runtime.createUser
);

/**
 * Selector: Returns the newly created user data.
 *
 * Semantics:
 * - `null` → no submission yet or state has been reset
 * - non-null → user was successfully created
 */
export const selectCreateUserData = createSelector(
  [selectCreateUserState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the create-user request is currently in progress.
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
 * Selector: Returns the UI-safe error message, if any.
 *
 * Error value is normalized via `extractErrorMessage`
 * and is safe for direct display.
 */
export const selectCreateUserError = createSelector(
  [selectCreateUserState],
  (state) => state.error
);

/**
 * Selector: Indicates whether the create-user operation completed successfully.
 *
 * Returns true only when:
 * - Request is not loading
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
  (data, loading, error) =>
    !loading && !error && data !== null
);

/**
 * Selector: Signals that the create-user state can be safely reset.
 *
 * This is intentionally derived from success to avoid
 * premature state clearing during retries.
 */
export const selectCreateUserShouldReset = createSelector(
  [selectCreateUserSuccess],
  (success) => success
);
