import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the Change Password slice.
 * Extracts the entire `changePassword` state from runtime subtree.
 */
const selectChangePasswordState = (state: RootState) =>
  selectRuntime(state).changePassword;

/**
 * Selector: Returns the change password data payload.
 * (Contains { changedAt } on success)
 */
export const selectChangePasswordData = createSelector(
  [selectChangePasswordState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the password change request is loading.
 */
export const selectChangePasswordLoading = createSelector(
  [selectChangePasswordState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message if the request failed.
 */
export const selectChangePasswordError = createSelector(
  [selectChangePasswordState],
  (state) => state.error
);

/**
 * Selector: Returns true if password change completed successfully.
 */
export const selectChangePasswordSuccess = createSelector(
  [selectChangePasswordData],
  (data) => !!data
);

/**
 * Selector: Returns the timestamp of the password change.
 */
export const selectChangePasswordChangedAt = createSelector(
  [selectChangePasswordData],
  (data) => data?.changedAt ?? null
);
