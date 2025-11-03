import {
  ORDER_CONSTANTS,
  type OrderCategory,
} from '@utils/constants/orderPermissions';
import type {
  OrderListFilters,
  PermissionContext,
} from '@features/order/state';

export interface OrderViewModeConfig {
  key: OrderCategory;
  label: string;
  path: `/orders/${string}`;
  canSee: (ctx: PermissionContext) => boolean;
  buildBaseFilters: (ctx: PermissionContext) => OrderListFilters;
  applyAllocationVisibility?: (
    ctx: PermissionContext,
    filters: OrderListFilters
  ) => OrderListFilters;
}

export const ORDER_VIEW_MODES: Record<OrderCategory, OrderViewModeConfig> = {
  sales: {
    key: 'sales',
    label: 'Sales Orders',
    path: '/orders/sales',
    canSee: (ctx) =>
      ctx.isRoot ||
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
      ctx.isRoot ||
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
      ctx.isRoot ||
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
      ctx.isRoot ||
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
