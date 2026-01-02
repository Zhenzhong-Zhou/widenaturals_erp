import { DynamicPermissionResolver, RouteParams } from '@routes/index';

/**
 * Resolves the effective permission required for a route.
 *
 * - Returns `undefined` if no permission is required
 * - Returns a string if the permission is static
 * - Delegates to a dynamic resolver when provided
 *
 * This function does not perform authorization checks;
 * it only resolves the permission value.
 */
export const resolvePermission = (
  requiredPermission?: string | DynamicPermissionResolver,
  routeParams: RouteParams = {}
): string | null | undefined => {
  if (!requiredPermission) return undefined;
  if (typeof requiredPermission === 'string') return requiredPermission;
  return requiredPermission(routeParams);
};
