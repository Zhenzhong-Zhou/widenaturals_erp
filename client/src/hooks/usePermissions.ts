import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type { UsePermissions } from '@features/authorize/state';
import {
  fetchPermissionsThunk,
  selectPermissions,
  selectPermissionsError,
  selectPermissionsLoading,
  selectRoleName,
} from '@features/authorize/state';
import { selectIsAuthenticated } from '@features/session/state';
import { ErrorType } from '@utils/error';

/**
 * usePermissions
 *
 * System-level hook responsible for hydrating and exposing
 * the authenticated user's role and permission state.
 *
 * Responsibilities:
 * - Automatically load permissions once the session is authenticated
 * - Expose raw permission data for guards and permission hooks
 * - Provide a stable readiness signal for permission evaluation
 *
 * Lifecycle:
 * - Permission loading is triggered automatically after authentication
 * - Fetching is skipped when the user is not authenticated
 *
 * Readiness semantics:
 * - `ready` indicates that permission data has been resolved
 * - Consumers must defer permission decisions until `ready === true`
 *
 * Error semantics:
 * - Authentication / authorization errors during initial load are ignored
 *   to allow token refresh and retry mechanisms to resolve them
 * - Non-authentication errors are logged and surfaced via `error`
 *
 * Architectural notes:
 * - This hook performs no navigation or UI side effects
 * - It does NOT expose a generic "fetch permissions" API
 * - Permission evaluation is delegated to `useHasPermission`
 * - Intended for route guards, layouts, and permission-aware logic
 *
 * @returns {UsePermissions}
 *   roleName    - Current role name (if available)
 *   permissions - Raw permission identifiers
 *   loading     - Permission loading state
 *   error       - Last unrecoverable permission error, if any
 *   ready       - Indicates whether permission data is resolved
 */
const usePermissions = (): UsePermissions => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  const roleName = useAppSelector(selectRoleName);
  const permissions = useAppSelector(selectPermissions);
  const loading = useAppSelector(selectPermissionsLoading);
  const error = useAppSelector(selectPermissionsError);
  
  /**
   * Permissions are considered "ready" once:
   * - the user is authenticated
   * - permission loading has completed
   */
  const ready = isAuthenticated && !loading;
  
  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const result = await dispatch(fetchPermissionsThunk());
    
    // Do NOT throw refreshable auth errors
    if (fetchPermissionsThunk.rejected.match(result)) {
      const payload = result.payload;
      
      if (
        payload?.type === ErrorType.Authentication ||
        payload?.type === ErrorType.Authorization
      ) {
        // Allow refresh / retry mechanisms to resolve this
        return;
      }
      
      // Truly unrecoverable
      console.error('Permission load failed:', payload);
    }
  }, [dispatch, isAuthenticated]);
  
  useEffect(() => {
    if (isAuthenticated) {
      void loadPermissions();
    }
  }, [loadPermissions, isAuthenticated]);
  
  return {
    roleName,
    permissions,
    loading,
    error,
    ready,
    refreshPermissions: loadPermissions,
  };
};

export default usePermissions;
