/**
 * Routing type definitions and helpers.
 *
 * Defines the shape of application routes, including
 * authentication requirements, permission guards,
 * and optional navigation menu metadata.
 */
import type { LazyExoticComponent, ComponentType } from 'react';

/**
 * Route parameter map passed to dynamic permission resolvers.
 *
 * Values may be `undefined` when optional route params
 * are not present or not matched.
 */
export type RouteParams = Record<string, string | undefined>;

/**
 * Resolves a permission dynamically based on route parameters.
 *
 * Returning:
 * - a string → required permission
 * - `null` → invalid route state (e.g. bad param), typically treated as 404
 */
export type DynamicPermissionResolver = (
  params: RouteParams
) => string | null;

// todo ddocsting and adjsut order fo placmenment
export type NavigationItem = {
  path: string;
  title: string;
  requiredPermission?: string;
  exact?: boolean;
};

/**
 * Metadata associated with a route.
 *
 * - `requiresAuth` indicates the route requires authentication
 * - `requiredPermission` may be static or dynamically resolved from route params
 * - `menu` controls navigation visibility and ordering
 */
export type RouteMeta = {
  requiresAuth?: boolean;
  requiredPermission?: string | DynamicPermissionResolver;
  menu?: {
    title: string;
    order?: number;
  };
};

/**
 * Application route definition.
 */
export type AppRoute = {
  path: string;
  component: LazyExoticComponent<ComponentType<any>>;
  meta?: RouteMeta;
};

/**
 * Identity helper for defining routes with strong typing.
 */
export const defineRoute = (route: AppRoute): AppRoute => {
  return route;
};
