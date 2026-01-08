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
import {
  selectIsAuthenticated,
  selectSessionResolving,
} from '@features/session/state/sessionSelectors';
import { ErrorType } from '@utils/error';

/**
 * usePermissions
 *
 * Canonical hook for resolving and exposing authorization context.
 *
 * Responsibilities:
 * - Fetch permission data for the authenticated user
 * - Expose role name, permission list, and resolution state
 * - Coordinate permission loading with session bootstrap lifecycle
 *
 * Resolution semantics:
 * - Permission fetching is gated by successful session resolution
 * - Permissions are fetched only for authenticated users
 * - The `ready` flag indicates permission evaluation is complete
 *   and safe for authorization checks
 *
 * Error handling:
 * - Authentication and authorization errors are treated as
 *   recoverable and silently ignored
 * - Non-auth errors are surfaced via `error` and logged defensively
 *
 * Explicitly out of scope:
 * - Authentication or session bootstrap logic
 * - Route guarding or redirect decisions
 * - Permission enforcement (delegated to guards/components)
 *
 * Notes:
 * - This hook is safe to mount globally (e.g., routing layer)
 * - Permission state may be temporarily undefined during bootstrap
 * - Consumers must tolerate transient loading states
 */
const usePermissions = (): UsePermissions => {
  const dispatch = useAppDispatch();
  
  // Session state
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const resolvingSession = useAppSelector(selectSessionResolving);
  
  // Permission state
  const roleName = useAppSelector(selectRoleName);
  const permissions = useAppSelector(selectPermissions);
  const loading = useAppSelector(selectPermissionsLoading);
  const error = useAppSelector(selectPermissionsError);
  
  /**
   * Permissions are considered ready once:
   * - session bootstrap has completed
   * - user is authenticated
   * - permission loading has completed
   */
  const ready =
    !resolvingSession &&
    isAuthenticated &&
    !loading;
  
  const loadPermissions = useCallback(async () => {
    // Wait for session bootstrap
    if (resolvingSession) return;
    
    // Only fetch for authenticated users
    if (!isAuthenticated) return;
    
    const result = await dispatch(fetchPermissionsThunk());
    
    if (fetchPermissionsThunk.rejected.match(result)) {
      const payload = result.payload;
      
      // Ignore refreshable auth errors
      if (
        payload?.type === ErrorType.Authentication ||
        payload?.type === ErrorType.Authorization
      ) {
        return;
      }
      
      // Truly unrecoverable
      console.error('Permission load failed:', payload);
    }
  }, [dispatch, isAuthenticated, resolvingSession]);
  
  useEffect(() => {
    if (!resolvingSession && isAuthenticated) {
      void loadPermissions();
    }
  }, [loadPermissions, resolvingSession, isAuthenticated]);
  
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
