import { ReactNode, useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useHasPermission } from '@features/authorize/hooks';
import type { DynamicPermissionResolver } from '@routes/index';
import { resolvePermission } from '@routes/index';

/**
 * Props for PermissionGuard.
 *
 * `requiredPermission` may be:
 * - a static permission string
 * - a resolver function using route params
 *
 * Returning `null` from the resolver indicates an invalid route state.
 */
type PermissionGuardProps = {
  requiredPermission?: string | DynamicPermissionResolver;
  children: ReactNode;
};

/**
 * PermissionGuard
 *
 * Route-level access control wrapper.
 *
 * Responsibilities:
 * - Resolve static or dynamic permission requirements
 * - Enforce access via centralized permission hook
 *
 * Behavior:
 * - No required permission → allow access
 * - Resolver returns null → invalid route → redirect to 404
 * - Permission pending → render nothing (non-blocking)
 * - Permission denied → redirect to access-denied
 * - Permission granted → render children
 *
 * Notes:
 * - Does NOT fetch permissions
 * - Does NOT inspect roles
 * - Does NOT block initial rendering
 * - Delegates all permission logic to `useHasPermission`
 */
const PermissionGuard = ({
  requiredPermission,
  children,
}: PermissionGuardProps) => {
  const params = useParams();
  const hasPermission = useHasPermission();

  const resolvedPermission = useMemo(
    () => resolvePermission(requiredPermission, params),
    [requiredPermission, params]
  );

  // No permission required → allow
  if (!requiredPermission) {
    return <>{children}</>;
  }

  // Invalid route state → 404
  if (resolvedPermission === null) {
    return <Navigate to="/404" replace />;
  }

  // Permission not required after resolution → allow
  if (resolvedPermission === undefined) {
    return <>{children}</>;
  }

  const result = hasPermission(resolvedPermission);

  // Permission state not resolved yet → do nothing
  if (result === 'pending') {
    return null; // or a skeleton if desired
  }

  // Permission explicitly denied → access denied
  if (!result) {
    return <Navigate to="/access-denied" replace />;
  }

  // Permission granted → allow
  return <>{children}</>;
};

export default PermissionGuard;
