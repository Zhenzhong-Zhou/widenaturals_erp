import { useHasPermission } from '@features/authorize/hooks';

/**
 * usePagePermissionState
 *
 * Resolves whether the current page or UI section is permitted
 * based on one or more required permissions.
 *
 * Responsibilities:
 * - Bridge tri-state permission evaluation into a stable boolean
 * - Provide a simple, UI-safe permission flag
 *
 * Semantics:
 * - Returns `true` only when permission is explicitly granted
 * - Returns `false` when permission is denied OR still pending
 *
 * Design notes:
 * - This hook intentionally collapses `'pending'` → `false`
 *   to avoid premature rendering or redirect loops
 * - Navigation and redirection must be handled elsewhere
 * - This hook MUST NOT cause side effects
 *
 * Typical usage:
 * - Page-level access checks
 * - Conditional UI rendering
 * - Feature visibility toggles
 *
 * @param requiredPermissions A permission or list of permissions (OR semantics)
 *
 * @returns Object containing `isAllowed` boolean
 */
const usePagePermissionState = (
  requiredPermissions: string | string[]
) => {
  const hasPermission = useHasPermission();
  
  const result = hasPermission(requiredPermissions);
  
  return {
    isAllowed: result === true,
  };
};

export default usePagePermissionState;
