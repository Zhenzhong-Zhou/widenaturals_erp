import { useCallback, useEffect } from 'react';
import { UsePermissions } from '../features/authorize/state/authorzeTypes.ts';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import { fetchPermissionsThunk } from '../features/authorize/state/authorizeThunk.ts';
import {
  selectPermissions,
  selectPermissionsError,
  selectPermissionsLoading,
  selectRoleName,
} from '../features/authorize/state/permissionSelector.ts';

const usePermissions = (): UsePermissions => {
  const dispatch = useAppDispatch();
  const roleName = useAppSelector(selectRoleName);
  const permissions = useAppSelector(selectPermissions);
  const loading = useAppSelector(selectPermissionsLoading);
  const error = useAppSelector(selectPermissionsError);
  
  // Fetch permissions using Redux thunk
  const loadPermissions = useCallback(async () => {
    try {
      await dispatch(fetchPermissionsThunk()).unwrap(); // Dispatch and unwrap the result
    } catch (err: any) {
      console.error('Failed to load permissions:', err.message || err);
    }
  }, [dispatch]);
  
  // Fetch permissions on component mount
  useEffect(() => {
    loadPermissions();
  }, [dispatch, loadPermissions]); // Only depends on `dispatch`
  
  // Provide a way to refresh permissions manually
  const refreshPermissions = async () => {
    try {
      await dispatch(fetchPermissionsThunk()).unwrap();
    } catch (err: any) {
      console.error('Failed to refresh permissions:', err.message || err);
    }
  };
  
  return { roleName, permissions, loading, error, refreshPermissions };
};

export default usePermissions;
