import {
  ORDER_CONSTANTS,
  type OrderCategory,
} from '@utils/constants/orderPermissions';
import type {
  OrderListFilters,
  OrderPermissionContext,
} from '@features/order/state';

/**
 * OrderViewModeConfig
 *
 * Declarative definition for a single order list mode.
 *
 * Notes:
 * - This is a static configuration object
 * - All logic must be pure and synchronous
 * - No access to hooks, router state, or UI components
 */
export interface OrderViewModeConfig {
  /** Unique mode key (matches route segment) */
  key: OrderCategory;

  /** Human-readable label for navigation / tabs */
  label: string;

  /** Route path for the mode */
  path: `/orders/${string}`;

  /**
   * Determines whether the mode is visible to the user.
   *
   * Called with a resolved OrderPermissionContext.
   */
  canSee: (ctx: OrderPermissionContext) => boolean;

  /**
   * Builds the base filter set for the mode.
   *
   * Executed when the mode is entered or filters are reset.
   */
  buildBaseFilters: (ctx: OrderPermissionContext) => OrderListFilters;

  /**
   * Optional filter adjustment based on permission context.
   *
   * Used for nuanced visibility rules (e.g. allocation-only users).
   */
  applyAllocationVisibility?: (
    ctx: OrderPermissionContext,
    filters: OrderListFilters
  ) => OrderListFilters;
}

/**
 * Order view-mode configuration registry.
 *
 * Defines the available order list modes (sales, purchase, transfer, etc.)
 * and their permission-aware behavior.
 *
 * Design principles:
 * - Declarative: behavior is described via configuration, not components
 * - Permission-aware: access rules are evaluated via OrderPermissionContext
 * - Framework-agnostic: no hooks, no React imports, no side effects
 *
 * Each view mode declares:
 * - Visibility rules (`canSee`)
 * - Base filter construction (`buildBaseFilters`)
 * - Optional filter adjustments based on permission context
 *
 * Permission semantics:
 * - All permission checks are delegated to `OrderPermissionContext`
 * - Root / superuser logic is handled upstream by permission hooks
 * - This module does not know about roles, loading state, or auth lifecycle
 *
 * Usage:
 * - Order list routing
 * - Tab visibility
 * - Initial filter derivation
 * - Access control at the view-mode level
 */
export const ORDER_VIEW_MODES: Record<OrderCategory, OrderViewModeConfig> = {
  sales: {
    key: 'sales',
    label: 'Sales Orders',
    path: '/orders/sales',
    canSee: (ctx) =>
      ctx.hasAny([
        ORDER_CONSTANTS.PERMISSIONS.ORDER.get('VIEW', 'SALES'),
        ORDER_CONSTANTS.PERMISSIONS.ALLOCATION.VIEW,
        ORDER_CONSTANTS.PERMISSIONS.ORDER.get('VIEW', 'ALL'),
      ]),
    buildBaseFilters: () => ({}),
    applyAllocationVisibility: (ctx, filters) => {
      const canViewSales = ctx.has(
        ORDER_CONSTANTS.PERMISSIONS.ORDER.get('VIEW', 'SALES')
      );
      const canViewAlloc = ctx.has(ORDER_CONSTANTS.PERMISSIONS.ALLOCATION.VIEW);

      if (!canViewSales && canViewAlloc) {
        return { ...filters, minStatusCode: 'ORDER_CONFIRMED' };
      }

      return filters;
    },
  },

  purchase: {
    key: 'purchase',
    label: 'Purchase Orders',
    path: '/orders/purchase',
    canSee: (ctx) =>
      ctx.hasAny([
        ORDER_CONSTANTS.PERMISSIONS.ORDER.get('VIEW', 'PURCHASE'),
        ORDER_CONSTANTS.PERMISSIONS.ORDER.get('VIEW', 'ALL'),
      ]),
    buildBaseFilters: () => ({}),
  },

  transfer: {
    key: 'transfer',
    label: 'Transfer Orders',
    path: '/orders/transfer',
    canSee: (ctx) =>
      ctx.hasAny([
        ORDER_CONSTANTS.PERMISSIONS.ORDER.get('VIEW', 'TRANSFER'),
        ORDER_CONSTANTS.PERMISSIONS.ORDER.get('VIEW', 'ALL'),
      ]),
    buildBaseFilters: () => ({}),
  },

  return: {
    key: 'return',
    label: 'Return Orders',
    path: '/orders/return',
    canSee: () => false,
    buildBaseFilters: () => ({}),
  },

  manufacturing: {
    key: 'manufacturing',
    label: 'Manufacturing Orders',
    path: '/orders/manufacturing',
    canSee: () => false,
    buildBaseFilters: () => ({}),
  },

  logistics: {
    key: 'logistics',
    label: 'Logistics Orders',
    path: '/orders/logistics',
    canSee: () => false,
    buildBaseFilters: () => ({}),
  },

  adjustment: {
    key: 'adjustment',
    label: 'Adjustment Orders',
    path: '/orders/adjustment',
    canSee: () => false,
    buildBaseFilters: () => ({}),
  },

  all: {
    key: 'all',
    label: 'All Orders',
    path: '/orders/all',
    canSee: (ctx) =>
      ctx.has(ORDER_CONSTANTS.PERMISSIONS.ORDER.get('VIEW', 'ALL')),
    buildBaseFilters: () => ({}),
  },

  allocatable: {
    key: 'allocatable',
    label: 'Allocatable Orders',
    path: '/orders/allocatable',
    canSee: (ctx) => ctx.has(ORDER_CONSTANTS.PERMISSIONS.ALLOCATION.VIEW),
    buildBaseFilters: () => ({}),
  },
};
