import { useCallback, useEffect, useMemo } from 'react';
import { UsePermissions } from '../features/authorize/state/authorzeTypes.ts';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import { fetchPermissionsThunk } from '../features/authorize/state/authorizeThunk.ts';
import {
  selectPermissions,
  selectPermissionsError,
  selectPermissionsLoading,
  selectRoleName,
} from '../features/authorize/state/permissionSelector.ts';
import { selectIsAuthenticated } from '../features/session/state/sessionSelectors.ts';
import { getEffectivePermissions } from '../utils/permissionUtils';

const usePermissions = (): UsePermissions => {
  const dispatch = useAppDispatch();

  // Select authentication state
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Select permission-related state
  const roleName = useAppSelector(selectRoleName);
  const permissions = useAppSelector(selectPermissions);
  const loading = useAppSelector(selectPermissionsLoading);
  const error = useAppSelector(selectPermissionsError);

  // Compute effective permissions
  const effectivePermissions = useMemo(
    () => getEffectivePermissions(roleName, permissions),
    [roleName, permissions]
  );

  // Fetch permissions
  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated) {
      console.warn('User is not authenticated. Skipping permission loading.');
      return; // Skip fetching permissions if not authenticated
    }

    try {
      await dispatch(fetchPermissionsThunk()).unwrap();
    } catch (err: any) {
      console.error('Failed to load permissions:', err.message || err);
    }
  }, [dispatch, isAuthenticated]);

  // Fetch permissions on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        await loadPermissions();
      })();
    }
  }, [loadPermissions, isAuthenticated]);

  // Provide a way to refresh permissions manually
  const refreshPermissions = async () => {
    if (!isAuthenticated) {
      console.warn('User is not authenticated. Skipping permission refresh.');
      return;
    }

    try {
      await dispatch(fetchPermissionsThunk()).unwrap();
    } catch (err: any) {
      console.error('Failed to refresh permissions:', err.message || err);
    }
  };

  return {
    roleName,
    permissions: effectivePermissions,
    loading,
    error,
    refreshPermissions,
  };
};

export default usePermissions;
