/**
 * @file PermissionGuard.tsx
 *
 * Route-level access control component.
 *
 * Supports both static permission rules and dynamic resolvers
 * that derive rules from route params. Delegates permission
 * evaluation to the `useHasPermission` hook.
 */
import type { ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useHasPermission } from '@features/authorize/hooks';
import type {
  PermissionRequirement,
  RouteParams,
  StaticPermissionRule,
} from '@routes/index';

/**
 * Props for PermissionGuard.
 *
 * `requiredPermission` may be:
 * - a static permission rule
 * - a resolver function that derives a permission rule from route params
 */
type PermissionGuardProps = {
  requiredPermission?: PermissionRequirement;
  children: ReactNode;
};

/**
 * Tri-state result of a single permission check.
 *
 * - true: permission confirmed
 * - false: permission denied
 * - 'pending': permission data not yet available
 */
type PermissionCheckResult = boolean | 'pending';

/**
 * Evaluates a static permission rule against the current user's permissions.
 *
 * Supported rule shapes:
 * - string: single required permission
 * - { any: [...] }: user must have at least one listed permission
 * - { all: [...] }: user must have every listed permission
 *
 * Short-circuits on the first decisive result per rule shape:
 * - `any`: returns true immediately on the first granted permission
 * - `all`: returns false immediately on the first denied permission
 *
 * Returns 'pending' only when no decisive result was reached and at least
 * one permission check is still loading.
 */
const matchesStaticPermissionRule = (
  rule: StaticPermissionRule,
  checkPermission: (permission: string) => PermissionCheckResult
): PermissionCheckResult => {
  if (typeof rule === 'string') {
    return checkPermission(rule);
  }
  
  if (rule.any !== undefined) {
    let sawPending = false;
    
    for (const permission of rule.any) {
      const result = checkPermission(permission);
      if (result === true) return true;
      if (result === 'pending') sawPending = true;
    }
    
    return sawPending ? 'pending' : false;
  }
  
  // `all` rule: every permission must be granted.
  let sawPending = false;
  
  for (const permission of rule.all) {
    const result = checkPermission(permission);
    if (result === false) return false;
    if (result === 'pending') sawPending = true;
  }
  
  return sawPending ? 'pending' : true;
};

/**
 * Route-level access control wrapper.
 *
 * Behavior:
 * - No required permission → allow access
 * - Resolver returns null → redirect to /not-found (invalid route state)
 * - Permission pending → render nothing until data is available
 * - Permission denied → redirect to /access-denied
 * - Permission granted → render children
 *
 * Notes:
 * - Permission evaluation is synchronous per render cycle
 * - This component does not fetch permissions or inspect roles directly
 */
const PermissionGuard = ({
                           requiredPermission,
                           children,
                         }: PermissionGuardProps) => {
  const checkPermission = useHasPermission();
  const params = useParams<RouteParams>();
  const location = useLocation();
  
  // No permission requirement means the route is accessible once authenticated.
  if (!requiredPermission) {
    return <>{children}</>;
  }
  
  const resolvedRule =
    typeof requiredPermission === 'function'
      ? requiredPermission(params)
      : requiredPermission;
  
  // A resolver returning null signals an invalid route state (e.g. an
  // unsupported param combination), not an open-access route.
  if (resolvedRule === null) {
    return <Navigate to="/not-found" replace />;
  }
  
  const isAllowed = matchesStaticPermissionRule(resolvedRule, checkPermission);
  
  // Suppress rendering until permission data is available. Without this guard,
  // 'pending' is truthy and falls through to render children, causing a
  // momentary flash of protected content before the redirect fires.
  if (isAllowed === 'pending') {
    return null;
  }
  
  if (!isAllowed) {
    return (
      <Navigate
        to="/access-denied"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  // Permission granted → allow
  return <>{children}</>;
};

export default PermissionGuard;
