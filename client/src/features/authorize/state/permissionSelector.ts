import { RootState } from '../../../store/store';

// Select permissions array
export const selectPermissions = (state: RootState) =>
  state.permissions.permissions;

// Select loading state
export const selectPermissionsLoading = (state: RootState) =>
  state.permissions.loading;

// Select error state
export const selectPermissionsError = (state: RootState) =>
  state.permissions.error;

// Select role name
export const selectRoleName = (state: RootState) => state.permissions.roleName;
