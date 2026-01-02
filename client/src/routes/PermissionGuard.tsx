import { ReactNode, useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import usePermissions from '@hooks/usePermissions';
import { hasPermission } from '@utils/permissionUtils';
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
 * Guards child routes based on resolved permissions.
 *
 * - Supports static permission strings
 * - Supports dynamic resolvers based on route params
 * - Redirects to 404 if permission cannot be resolved
 * - Redirects to access-denied if permission check fails
 */
const PermissionGuard = ({
  requiredPermission,
  children,
}: PermissionGuardProps) => {
  const { roleName, permissions } = usePermissions();
  const params = useParams();

  // Resolve permission once per route/param change
  const resolvedPermission = useMemo(() => {
    return resolvePermission(requiredPermission, params);
  }, [requiredPermission, params]);

  if (!requiredPermission) {
    return <>{children}</>;
  }

  if (resolvedPermission === null) {
    return <Navigate to="/404" replace />;
  }

  if (
    resolvedPermission !== undefined &&
    !hasPermission(resolvedPermission, permissions, roleName)
  ) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};

export default PermissionGuard;
