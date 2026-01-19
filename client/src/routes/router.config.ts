/**
 * Application route definitions.
 *
 * Serves as the single source of truth for:
 * - Route paths and lazy-loaded page components
 * - Authentication and permission requirements
 * - Navigation menu metadata (title and ordering)
 * - Dynamic permission resolution based on route params
 *
 * Notes:
 * - Dynamic permission resolvers may return `null` to indicate
 *   an invalid route, which results in a 404 redirect.
 * - Routes are grouped by functional domain for readability.
 */

import { lazy } from 'react';
import type { AppRoute, DynamicPermissionResolver } from './routeTypes';
import { defineRoute } from './routeTypes';
import {
  ORDER_CONSTANTS,
  toPermissionValue,
} from '@utils/constants/orderPermissions';
import { isValidOrderCategory } from '@features/order/utils/orderCategoryUtils';

/* ==================== ROUTES ==================== */

export const appRoutes: AppRoute[] = [
  /* ---------- Public ---------- */
  
  defineRoute({
    path: '/',
    component: lazy(() => import('@pages/home/PublicHomePage')),
  }),
  
  defineRoute({
    path: '/login',
    component: lazy(() => import('@features/session/pages/LoginPage')),
  }),
  
  /* ---------- Core ---------- */
  
  defineRoute({
    path: '/dashboard',
    component: lazy(() => import('@features/dashboard/pages/DashboardPage')),
    meta: {
      requiresAuth: true,
      menu: { title: 'Dashboard', order: 1 },
    },
  }),
  
  defineRoute({
    path: '/profile',
    component: lazy(() => import('@features/user/pages/UserProfilePage')),
    meta: { requiresAuth: true },
  }),
  
  defineRoute({
    path: '/settings',
    component: lazy(() => import('@features/settings/pages/SettingsPage')),
    meta: { requiresAuth: true },
  }),
  
  /* ---------- Users ---------- */
  
  defineRoute({
    path: '/users',
    component: lazy(() => import('@features/user/pages/UserCardPage')),
    meta: {
      requiresAuth: true,
      menu: { title: 'Users', order: 2 },
    },
  }),
  
  defineRoute({
    path: '/users/list',
    component: lazy(() => import('@features/user/pages/UserListPage')),
    meta: {
      requiresAuth: true,
      menu: { title: 'User Management', order: 3 },
    },
  }),
  
  defineRoute({
    path: '/users/new',
    component: lazy(() => import('@features/user/pages/CreateUserPage')),
    meta: {
      requiresAuth: true,
      parent: '/users',
    },
  }),
  
  defineRoute({
    path: '/users/:userId/profile',
    component: lazy(() => import('@features/user/pages/UserProfilePage')),
    meta: { requiresAuth: true },
  }),
  
  /* ---------- Products & Catalog ---------- */
  
  defineRoute({
    path: '/products',
    component: lazy(() => import('@features/product/pages/ProductListPage')),
    meta: {
      requiresAuth: true,
      menu: { title: 'Product Management', order: 4 },
    },
  }),
  
  defineRoute({
    path: '/product-catalog',
    component: lazy(() => import('@features/sku/pages/ProductCatalogPage')),
    meta: {
      requiresAuth: true,
      menu: { title: 'Product Catalog', order: 5 },
    },
  }),
  
  defineRoute({
    path: '/products/:productId',
    component: lazy(() => import('@features/product/pages/ProductDetailPage')),
    meta: { requiresAuth: true },
  }),
  
  defineRoute({
    path: '/skus',
    component: lazy(() => import('@features/sku/pages/SkuListPage')),
    meta: {
      requiresAuth: true,
      menu: { title: 'SKU Management', order: 6 },
    },
  }),
  
  defineRoute({
    path: '/skus/new',
    component: lazy(() => import('@features/sku/pages/CreateSkuPage')),
    meta: {
      requiresAuth: true,
      parent: '/skus',
    },
  }),
  
  defineRoute({
    path: '/skus/:skuId',
    component: lazy(() => import('@features/sku/pages/SkuDetailPage')),
    meta: {
      requiresAuth: true,
      parent: '/skus',
    },
  }),
  
  defineRoute({
    path: '/boms',
    component: lazy(() => import('@features/bom/pages/BomsListPage')),
    meta: {
      requiresAuth: true,
      menu: { title: 'BOM Management', order: 7 },
    },
  }),
  
  defineRoute({
    path: '/boms/:bomId',
    component: lazy(() => import('@features/bom/pages/BomOverviewPage')),
    meta: {
      requiresAuth: true,
      parent: '/boms',
    },
  }),
  
  /* ---------- Orders ---------- */
  
  defineRoute({
    path: '/orders',
    component: lazy(() => import('@features/order/layouts/OrdersLayout')),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_orders',
    },
  }),
  
  defineRoute({
    path: '/orders/:mode/all',
    component: lazy(() => import('@features/order/pages/OrdersListPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: ((params) =>
        params.mode && isValidOrderCategory(params.mode)
          ? toPermissionValue('VIEW', params.mode)
          : null) satisfies DynamicPermissionResolver,
    },
  }),
  
  defineRoute({
    path: '/orders/:category/new',
    component: lazy(() => import('@features/order/pages/OrderBasePage')),
    meta: {
      requiresAuth: true,
      requiredPermission: ((params) => {
        const category = params.category;
        if (!category || !isValidOrderCategory(category)) return null;
        return toPermissionValue('VIEW', category);
      }) satisfies DynamicPermissionResolver,
    },
  }),
  
  defineRoute({
    path: ':mode/:category/details/:orderId',
    component: lazy(() => import('@features/order/pages/OrderDetailsPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: ((params) => {
        const { category } = params;
        if (!category || !isValidOrderCategory(category)) return null;
        return category === 'allocatable'
          ? ORDER_CONSTANTS.PERMISSIONS.ALLOCATION.VIEW
          : toPermissionValue('VIEW', category);
      }) satisfies DynamicPermissionResolver,
    },
  }),
  
  /* ---------- Inventory & Warehousing ---------- */
  
  defineRoute({
    path: '/inventory-overview',
    component: lazy(
      () => import('@features/inventoryOverview/pages/InventoryOverviewPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_inventory_overview',
      menu: { title: 'Inventory Overview', order: 8 },
    },
  }),
  
  defineRoute({
    path: '/warehouses',
    component: lazy(() => import('@features/warehouse/pages/WarehousesPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_warehouses',
      menu: { title: 'Warehouses', order: 9 },
    },
  }),
  
  defineRoute({
    path: '/warehouse-inventory',
    component: lazy(
      () => import('@features/warehouseInventory/pages/WarehouseInventoryPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_warehouses',
      menu: { title: 'Warehouse Inventory', order: 10 },
    },
  }),
  
  defineRoute({
    path: '/inventory-allocations',
    component: lazy(
      () =>
        import('@features/inventoryAllocation/pages/InventoryAllocationsPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_inventory_allocations',
      menu: { title: 'Inventory Allocation', order: 11 },
    },
  }),
  
  defineRoute({
    path: '/inventory-allocations/review/:orderId',
    component: lazy(
      () => import('@features/inventoryAllocation/pages/InventoryAllocationReviewPage')
    ),
    meta: { requiresAuth: true },
  }),
  
  /* ---------- Compliance & Admin ---------- */
  
  defineRoute({
    path: '/compliance-records',
    component: lazy(
      () => import('@features/complianceRecord/pages/ComplianceRecordListPage')
    ),
    meta: {
      requiresAuth: true,
      menu: { title: 'Compliance Management', order: 12 },
    },
  }),
  
  defineRoute({
    path: '/pricing-types',
    component: lazy(
      () => import('@features/pricingType/pages/PricingTypePage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_prices',
      menu: { title: 'Pricing Types', order: 13 },
    },
  }),
  
  defineRoute({
    path: '/locations',
    component: lazy(() => import('@features/location/pages/LocationPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_locations',
      menu: { title: 'Locations', order: 14 },
    },
  }),
  
  /* ---------- Reports ---------- */
  
  defineRoute({
    path: '/reports/inventory-activity-logs',
    component: lazy(
      () => import('@features/report/pages/InventoryActivityLogsPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_inventory_logs',
      menu: { title: 'Inventory Activity Logs', order: 15 },
    },
  }),
  
  /* ---------- Customers & CRM ---------- */
  
  defineRoute({
    path: '/customers',
    component: lazy(() => import('@features/customer/pages/CustomersPage')),
    meta: {
      requiresAuth: true,
      menu: { title: 'Customers', order: 16 },
    },
  }),
  
  defineRoute({
    path: '/addresses',
    component: lazy(() => import('@features/address/pages/AddressesPage')),
    meta: {
      requiresAuth: true,
      menu: { title: 'Addresses', order: 17 },
    },
  }),
  
  defineRoute({
    path: '/order-types',
    component: lazy(() => import('@features/orderType/pages/OrderTypesPage')),
    meta: {
      requiresAuth: true,
      menu: { title: 'Order Types', order: 18 },
    },
  }),
  
  defineRoute({
    path: '/fulfillments',
    component: lazy(
      () =>
        import('@features/outboundFulfillment/pages/OutboundFulfillmentsListPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_outbound_fulfillments',
      menu: { title: 'Fulfillment', order: 19 },
    },
  }),
  
  defineRoute({
    path: '/fulfillments/outbound-shipment/:shipmentId',
    component: lazy(
      () =>
        import('@features/outboundFulfillment/pages/OutboundShipmentDetailsPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_outbound_fulfillments',
    },
  }),
  
  /* ---------- System ---------- */
  
  defineRoute({
    path: '/access-denied',
    component: lazy(() => import('@pages/system/AccessDeniedPage')),
    meta: { requiresAuth: true },
  }),
  
  defineRoute({
    path: '*',
    component: lazy(() => import('@pages/system/NotFoundPage')),
  }),
];
