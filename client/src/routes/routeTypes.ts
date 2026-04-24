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
 * Values may be undefined when optional route params
 * are absent or not matched.
 */
export type RouteParams = Record<string, string | undefined>;

/**
 * Static permission rule requiring at least one permission match.
 *
 * Example:
 * { any: ['view_warehouses', 'view_warehouse_inventory'] }
 */
export type AnyPermissionRule = {
  any: readonly string[];
  all?: never;
};

/**
 * Static permission rule requiring all listed permissions.
 *
 * Example:
 * { all: ['view_orders', 'edit_orders'] }
 */
export type AllPermissionRule = {
  all: readonly string[];
  any?: never;
};

/**
 * Declarative static permission rule.
 *
 * Semantics:
 * - string: a single required permission
 * - { any: [...] }: user must have at least one permission
 * - { all: [...] }: user must have every listed permission
 */
export type StaticPermissionRule =
  | string
  | AnyPermissionRule
  | AllPermissionRule;

/**
 * Resolves a permission rule dynamically from route params.
 *
 * Return values:
 * - StaticPermissionRule: permission rule to enforce
 * - null: invalid or unsupported route state
 *
 * Important:
 * The caller should handle null consistently, typically as
 * a denied route or invalid route state.
 */
export type DynamicPermissionResolver = (
  params: RouteParams
) => StaticPermissionRule | null;

/**
 * Permission requirement accepted by route-level guards.
 *
 * Routes may use either:
 * - a static permission rule
 * - a dynamic resolver based on route params
 */
export type PermissionRequirement =
  | StaticPermissionRule
  | DynamicPermissionResolver;

/**
 * Sidebar / navigation item definition.
 *
 * Design notes:
 * - Visibility is permission-aware
 * - Navigation permissions are declarative only
 * - Enforcement is handled by the rendering layer
 */
export type NavigationItem = {
  /**
   * Route path for the navigation item.
   *
   * Must match a valid application route.
   */
  path: string;
  
  /**
   * Human-readable label shown in the UI.
   */
  title: string;
  
  /**
   * Static permission rule controlling visibility of this item.
   *
   * Navigation should remain declarative and should not depend on
   * route params, so only static permission rules are allowed here.
   */
  requiredPermission?: StaticPermissionRule;
  
  /**
   * Whether active matching should use an exact path match.
   *
   * Defaults to false when omitted.
   */
  exact?: boolean;
};

/**
 * Metadata attached to an application route.
 */
export type RouteMeta = {
  /**
   * Whether the route requires an authenticated session.
   */
  requiresAuth?: boolean;
  
  /**
   * Whether the route is only available to unauthenticated users.
   *
   * Typical examples:
   * - login
   * - register
   * - forgot password
   */
  guestOnly?: boolean;
  
  /**
   * Permission requirement for accessing the route.
   *
   * Routes support both static rules and dynamic resolvers.
   */
  requiredPermission?: PermissionRequirement;
  
  /**
   * Optional menu metadata for list/navigation generation.
   *
   * Intended for menu-building concerns only.
   */
  menu?: {
    /**
     * Display title used in navigation UIs.
     */
    title: string;
    
    /**
     * Optional sort order within a menu group.
     */
    order?: number;
    
    /**
     * Optional icon rendered alongside the title.
     */
    icon?: ReactNode;
  };
  
  /**
   * Parent route path used for hierarchy, breadcrumbs,
   * and active menu resolution.
   */
  parent?: string;
  
  /**
   * Explicitly hide this route from generated navigation.
   */
  hidden?: boolean;
};

/**
 * Application route definition.
 */
export type AppRoute = {
  /**
   * Route path pattern.
   */
  path: string;
  
  /**
   * Lazy-loaded route component.
   */
  component: LazyExoticComponent<ComponentType<any>>;
  
  /**
   * Optional route metadata.
   */
  meta?: RouteMeta;
};

/**
 * Identity helper for defining routes with strong typing.
 */
export const defineRoute = (route: AppRoute): AppRoute => {
  return route;
};
