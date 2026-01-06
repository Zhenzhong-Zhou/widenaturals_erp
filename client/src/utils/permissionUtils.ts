/**
 * Resolves the effective permission set for the current user.
 *
 * This helper normalizes role-based permission behavior and
 * provides a single source of truth for permission derivation.
 *
 * Semantics:
 * - If `roleName` is null, permissions are considered unresolved
 *   and the raw permission list is returned unchanged
 * - `root_admin` is treated as a special role with unrestricted access
 * - All other roles rely on the explicit permission list
 *
 * Design notes:
 * - This function is pure and side effect free
 * - It must remain synchronous and deterministic
 * - It does NOT perform permission checks; use `hasPermission` for that
 *
 * @param roleName Resolved role name or null if not yet available
 * @param permissions Raw permission identifiers from the backend
 * @returns Normalized effective permission list
 */
export const getEffectivePermissions = (
  roleName: string | null,
  permissions: string[]
): string[] => {
  if (!roleName) {
    return permissions; // unauthenticated or not yet resolved
  }
  
  if (roleName === 'root_admin') {
    return ['root_access'];
  }
  
  return permissions;
};

/**
 * Evaluates whether the current user satisfies a required permission.
 *
 * This helper centralizes permission evaluation logic and ensures
 * consistent handling of unresolved, role-based, and explicit permissions.
 *
 * Semantics:
 * - If permissions are not yet resolved (`roleName === null`),
 *   access is denied by default
 * - `root_admin` always satisfies permission checks
 * - If no specific permission is required, access is granted
 * - Otherwise, the permission must exist in the resolved list
 *
 * Usage:
 * - Route guards
 * - Conditional UI rendering
 * - Action-level permission checks
 *
 * @param requiredPermission Permission identifier required for access
 * @param permissions Effective permission list
 * @param roleName Resolved role name or null if not yet available
 * @returns Whether access should be granted
 */
export const hasPermission = (
  requiredPermission: string | undefined,
  permissions: string[],
  roleName: string | null
): boolean => {
  // Permissions not resolved yet → do not deny access prematurely
  if (!roleName) {
    return false;
  }
  
  // Root admin bypass
  if (roleName === 'root_admin') {
    return true;
  }
  
  // No specific permission required
  if (!requiredPermission) {
    return true;
  }
  
  return permissions.includes(requiredPermission);
};
