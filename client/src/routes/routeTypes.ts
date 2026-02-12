/**
 * Routing type definitions and helpers.
 *
 * Defines the shape of application routes, including
 * authentication requirements, permission guards,
 * and optional navigation menu metadata.
 */
import type { LazyExoticComponent, ComponentType, ReactNode } from 'react';

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
export type DynamicPermissionResolver = (params: RouteParams) => string | null;

/**
 * Navigation item definition.
 *
 * Represents a single entry in the application navigation tree.
 *
 * Design notes:
 * - Navigation visibility is permission-aware
 * - Permission evaluation is handled externally via permission hooks
 * - This type is framework-agnostic and contains no logic
 *
 * Semantics:
 * - If `requiredPermission` is undefined, the item is always visible
 * - If defined, visibility is determined by the caller using permission hooks
 */
export type NavigationItem = {
  /**
   * Route path for the navigation item.
   *
   * Must match a valid application route.
   */
  path: string;
  
  /**
   * Human-readable label for display in the UI.
   */
  title: string;
  
  /**
   * Permission required to display this navigation item.
   *
   * When provided, the item should only be rendered if
   * the current user satisfies the permission.
   *
   * This is a declarative requirement; enforcement is handled
   * by the navigation renderer, not by this type.
   */
  requiredPermission?: string | readonly string[];
  
  /**
   * Whether the route match should be exact.
   *
   * Defaults to false when omitted.
   */
  exact?: boolean;
};

/**
 * Metadata associated with a route.
 *
 * Semantics:
 * - `requiresAuth` indicates the route requires an authenticated session
 * - `guestOnly` indicates the route is only for unauthenticated users
 * - `requiredPermission` may be static or dynamically resolved from route params
 * - `menu` controls sidebar visibility, labeling, and ordering (list routes only)
 * - `parent` links detail routes to their list/section route for hierarchy
 * - `hidden` explicitly prevents a route from appearing in navigation
 *
 * Rules:
 * - Only list routes should define `menu`
 * - Detail and nested routes should define `parent`
 * - Routes without `menu` never appear in the sidebar
 * - `hidden` overrides `menu` visibility when present
 */
export type RouteMeta = {
  /** Route requires authenticated session */
  requiresAuth?: boolean;

  /** Route is only available to unauthenticated users (e.g. login/register) */
  guestOnly?: boolean;
  
  /** Permission required to access the route */
  requiredPermission?: string | DynamicPermissionResolver;
  
  /** Sidebar / navigation menu config (list routes only) */
  menu?: {
    title: string;
    order?: number;
    icon?: ReactNode;
  };
  
  /** Parent route path for hierarchy, breadcrumbs, and active menu */
  parent?: string;
  
  /** Explicitly prevent route from appearing in menus */
  hidden?: boolean;
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
