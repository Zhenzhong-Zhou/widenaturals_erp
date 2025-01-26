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
import { getEffectivePermissions } from '../utils/permissionUtils';

const usePermissions = (): UsePermissions => {
  const dispatch = useAppDispatch();
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
    try {
      await dispatch(fetchPermissionsThunk()).unwrap();
    } catch (err: any) {
      console.error('Failed to load permissions:', err.message || err);
    }
  }, [dispatch]);
  
  // Fetch permissions on mount
  useEffect(() => {
    (async () => {
      await loadPermissions();
    })();
  }, [loadPermissions]);
  
  // Provide a way to refresh permissions manually
  const refreshPermissions = async () => {
    try {
      await dispatch(fetchPermissionsThunk()).unwrap();
    } catch (err: any) {
      console.error('Failed to refresh permissions:', err.message || err);
    }
  };
  
  return { roleName, permissions: effectivePermissions, loading, error, refreshPermissions };
};

export default usePermissions;
