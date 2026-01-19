import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { PermissionsState } from '@features/authorize';

/**
 * selectPermissionsState
 *
 * Base selector for the permissions runtime slice.
 *
 * Responsibilities:
 * - Extract the permissions slice from runtime state
 *
 * Design notes:
 * - This selector MUST be a plain function
 * - Base selectors must NOT use `createSelector`
 * - Memoization at this level provides no benefit and breaks
 *   React-Redux selector validation
 *
 * @param state Root redux state
 * @returns PermissionsState
 */
const selectPermissionsState = (state: RootState) =>
  selectRuntime(state).permissions as PermissionsState;

/**
 * selectPermissions
 *
 * Select the resolved permission keys for the current user.
 *
 * @returns string[]
 */
export const selectPermissions = createSelector(
  [selectPermissionsState],
  (state) => state.permissions
);

/**
 * selectPermissionsLoading
 *
 * Select whether permission data is currently being resolved.
 *
 * @returns boolean
 */
export const selectPermissionsLoading = createSelector(
  [selectPermissionsState],
  (state) => state.loading
);

/**
 * selectPermissionsError
 *
 * Select any permission resolution error.
 *
 * @returns string | null
 */
export const selectPermissionsError = createSelector(
  [selectPermissionsState],
  (state) => state.error
);

/**
 * selectRoleName
 *
 * Select the current resolved role name.
 *
 * @returns string | null
 */
export const selectRoleName = createSelector(
  [selectPermissionsState],
  (state) => state.roleName
);
