import { useCallback } from 'react';
import { usePermissionsContext } from '@context/PermissionsContext';
import type { PermissionCheckOptions } from '@features/authorize/state/authorzeTypes';

/**
 * useHasPermission
 *
 * Centralized permission evaluation hook.
 *
 * Responsibilities:
 * - Evaluate whether the current user satisfies a permission requirement
 * - Support OR / AND semantics for multiple permissions
 * - Gracefully handle unresolved permission state during app bootstrap
 *
 * Return semantics:
 * - `true`      → permission satisfied
 * - `false`     → permission denied
 * - `'pending'` → permission state not yet resolved
 *
 * Design notes:
 * - Permission resolution is non-blocking
 * - Callers MUST explicitly handle the `'pending'` state where relevant
 * - Root / superuser bypass is handled internally via `bypassPermissions`
 *
 * MUST NOT:
 * - Trigger navigation or redirects
 * - Perform data fetching
 * - Infer roles directly
 *
 * Typical usage:
 * - Route guards (with pending-safe handling)
 * - Conditional UI rendering
 * - Action-level permission checks
 *
 * @returns A stable permission-checking function
 */
const useHasPermission = () => {
  const { permissions, ready } = usePermissionsContext();

  return useCallback(
    (
      required: string | readonly string[],
      options: PermissionCheckOptions = {}
    ): boolean | 'pending' => {
      // Permissions not yet resolved → defer decision
      if (!ready) return 'pending';

      const { requireAll = false, bypassPermissions = ['root_access'] } =
        options;

      /**
       * Root / superuser bypass.
       *
       * Presence of any bypass permission grants full access.
       */
      if (permissions.some((p) => bypassPermissions.includes(p))) {
        return true;
      }

      const requiredPermissions = Array.isArray(required)
        ? required
        : [required];

      return requireAll
        ? requiredPermissions.every((p) => permissions.includes(p))
        : requiredPermissions.some((p) => permissions.includes(p));
    },
    [permissions, ready]
  );
};

export default useHasPermission;
