import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { PermissionsState } from './permissionSlice';

const getPermissionsState = (state: RootState): PermissionsState =>
  state.permissions as PermissionsState;

/**
 * Select the permissions array.
 */
export const selectPermissions = createSelector(
  getPermissionsState,
  (state) => state.permissions
);

/**
 * Select loading status.
 */
export const selectPermissionsLoading = createSelector(
  getPermissionsState,
  (state) => state.loading
);

/**
 * Select error state.
 */
export const selectPermissionsError = createSelector(
  getPermissionsState,
  (state) => state.error
);

/**
 * Select the current role name.
 */
export const selectRoleName = createSelector(
  getPermissionsState,
  (state) => state.roleName
);
