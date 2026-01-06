import { useCallback, useEffect, useMemo } from 'react';
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
import { getEffectivePermissions } from '@utils/permissionUtils';
import { ErrorType } from '@utils/error';
import { hardLogout } from '@features/session/utils/hardLogout';

/**
 * usePermissions
 *
 * System-level hook responsible for hydrating and exposing
 * the authenticated user's role and effective permission set.
 *
 * Responsibilities:
 * - Automatically load permissions once the session is authenticated
 * - Expose derived (effective) permissions for UI and route guards
 * - Provide a controlled escape hatch to explicitly refresh permissions
 *
 * Lifecycle:
 * - Permission loading is triggered automatically after authentication.
 * - Fetching is blocked when the user is not authenticated.
 *
 * Error semantics:
 * - Initial load:
 *   - Authentication / authorization errors are intentionally ignored
 *     to allow token refresh and retry mechanisms to resolve them.
 *   - Non-auth errors are logged and treated as unrecoverable.
 * - Explicit refresh (`refreshPermissions`):
 *   - Authentication / authorization errors trigger a hard logout.
 *   - Other errors are logged but do not crash the application.
 *
 * Architectural notes:
 * - This hook performs no navigation or UI side effects.
 * - It must not expose a generic "fetch" API to feature components.
 * - Permission derivation is memoized and stable across renders.
 * - Intended for use by route guards, layouts, and permission-aware UI.
 *
 * @returns {UsePermissions}
 *   roleName           - Current role name (if available)
 *   permissions        - Effective permission set
 *   loading            - Permission fetch loading state
 *   error              - Last permission fetch error (if any)
 *   refreshPermissions - Explicit permission revalidation (rare use)
 */
const usePermissions = (): UsePermissions => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  const roleName = useAppSelector(selectRoleName);
  const permissions = useAppSelector(selectPermissions);
  const loading = useAppSelector(selectPermissionsLoading);
  const error = useAppSelector(selectPermissionsError);
  
  const effectivePermissions = useMemo(
    () => getEffectivePermissions(roleName, permissions),
    [roleName, permissions]
  );
  
  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const result = await dispatch(fetchPermissionsThunk());
    
    // DO NOT THROW refreshable auth errors
    if (fetchPermissionsThunk.rejected.match(result)) {
      const payload = result.payload;
      
      if (
        payload?.type === ErrorType.Authentication ||
        payload?.type === ErrorType.Authorization
      ) {
        // Allow Axios refresh / retry mechanisms to resolve this
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
  
  /**
   * Explicit permission refresh.
   *
   * Intended for rare system flows such as:
   * - Role changes during an active session
   * - Privilege mutations
   * - Tenant or organization switching
   *
   * Auth failures during refresh are considered unrecoverable
   * and will force a hard logout.
   */
  const refreshPermissions = async () => {
    if (!isAuthenticated) return;
    
    const result = await dispatch(fetchPermissionsThunk());
    
    if (fetchPermissionsThunk.rejected.match(result)) {
      const payload = result.payload;
      
      if (
        payload?.type === ErrorType.Authentication ||
        payload?.type === ErrorType.Authorization
      ) {
        await hardLogout();
        return;
      }
      
      console.error('Non-fatal permission refresh error:', payload);
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
