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
import { isValidOrderCategory } from '@features/order/utils';

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
    },
  }),
  
  defineRoute({
    path: '/users/list',
    component: lazy(() => import('@features/user/pages/UserListPage')),
    meta: {
      requiresAuth: true,
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
    },
  }),
  
  defineRoute({
    path: '/product-catalog',
    component: lazy(() => import('@features/sku/pages/ProductCatalogPage')),
    meta: {
      requiresAuth: true,
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
  
  // batch
  defineRoute({
    path: '/batch-registry',
    component: lazy(() => import('@features/batchRegistry/pages/BatchRegistryListPage')),
    meta: {
      requiresAuth: true,
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
    },
  }),
  
  defineRoute({
    path: '/warehouses',
    component: lazy(() => import('@features/warehouse/pages/WarehousesPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_warehouses',
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
    },
  }),
  
  defineRoute({
    path: '/pricing-types',
    component: lazy(
      () => import('@features/pricingType/pages/PricingTypePage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_price_types',
    },
  }),
  defineRoute({
    path: '/pricing-types/:slug/:id',
    component: lazy(
      () => import('@features/pricingType/pages/PricingTypeDetailsPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_price_type_details',
    },
  }),
  
  defineRoute({
    path: '/prices',
    component: lazy(
      () => import('@features/pricing/pages/PricingListPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_prices',
    },
  }),
  
  defineRoute({
    path: '/prices/:sku/:id',
    component: lazy(
      () => import('@features/pricing/pages/PricingDetailPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_price_details',
    },
  }),
  
  defineRoute({
    path: '/location-types',
    component: lazy(() => import('@features/locationType/pages/LocationTypePage')),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_location_types',
    },
  }),
  
  defineRoute({
    path: '/locations',
    component: lazy(() => import('@features/location/pages/LocationPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_locations',
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
    },
  }),
  
  /* ---------- Customers & CRM ---------- */
  
  defineRoute({
    path: '/customers',
    component: lazy(() => import('@features/customer/pages/CustomersPage')),
    meta: {
      requiresAuth: true,
    },
  }),
  
  defineRoute({
    path: '/addresses',
    component: lazy(() => import('@features/address/pages/AddressesPage')),
    meta: {
      requiresAuth: true,
    },
  }),
  
  defineRoute({
    path: '/order-types',
    component: lazy(() => import('@features/orderType/pages/OrderTypesPage')),
    meta: {
      requiresAuth: true,
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
