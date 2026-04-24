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
  toPermissionValue,
} from '@utils/constants/orderPermissions';
import { isValidOrderCategory } from '@features/order/utils';
import ROUTE_PERMISSIONS from '@utils/constants/routePermissionConstants';

/* ==================== ROUTES ==================== */

export const appRoutes: AppRoute[] = [
  /* ---------- Public ---------- */

  defineRoute({
    path: '/',
    component: lazy(() => import('@pages/home/PublicHomePage')),
    meta: {
      guestOnly: true,
    },
  }),

  defineRoute({
    path: '/login',
    component: lazy(() => import('@features/session/pages/LoginPage')),
    meta: {
      guestOnly: true,
    },
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
    path: '/sku-images/upload',
    component: lazy(
      () => import('@features/skuImage/pages/SkuImageBulkUploadPage')
    ),
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
    component: lazy(
      () => import('@features/batchRegistry/pages/BatchRegistryListPage')
    ),
    meta: {
      requiresAuth: true,
    },
  }),

  defineRoute({
    path: '/product-batches',
    component: lazy(
      () => import('@features/productBatch/pages/ProductBatchListPage')
    ),
    meta: {
      requiresAuth: true,
    },
  }),

  defineRoute({
    path: '/packaging-material-batches',
    component: lazy(
      () =>
        import('@features/packagingMaterialBatch/pages/PackagingMaterialBatchListPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission:
        ROUTE_PERMISSIONS.PACKAGING_MATERIAL_BATCHES.VIEW_LIST,
    },
  }),

  /* ---------- Orders ---------- */

  defineRoute({
    path: '/orders',
    component: lazy(() => import('@features/order/layouts/OrdersLayout')),
    meta: {
      requiresAuth: true,
      requiredPermission: ROUTE_PERMISSIONS.ORDERS.VIEW,
    },
  }),

  defineRoute({
    path: '/orders/:mode/all',
    component: lazy(() => import('@features/order/pages/OrdersListPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: ((params) => {
        const category = params.category;
        if (!category || !isValidOrderCategory(category)) return null;
        
        return {
          any: [toPermissionValue('VIEW', category)],
        };
      }) satisfies DynamicPermissionResolver,
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
        
        return {
          any: [toPermissionValue('VIEW', category)],
        };
      }) satisfies DynamicPermissionResolver,
    },
  }),

  defineRoute({
    path: ':mode/:category/details/:orderId',
    component: lazy(() => import('@features/order/pages/OrderDetailsPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: ((params) => {
        const category = params.category;
        if (!category || !isValidOrderCategory(category)) return null;
        
        return {
          any: [toPermissionValue('VIEW', category)],
        };
      }) satisfies DynamicPermissionResolver,
    },
  }),

  /* ---------- Inventory & Warehousing ---------- */

  defineRoute({
    path: '/warehouses',
    component: lazy(() => import('@features/warehouse/pages/WarehouseListPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: {
        any: [
          ROUTE_PERMISSIONS.WAREHOUSES.VIEW,
          ROUTE_PERMISSIONS.WAREHOUSE_INVENTORY.VIEW,
        ],
      },
    },
  }),

  defineRoute({
    path: '/warehouse-inventory/:warehouseId/inventory',
    component: lazy(
      () => import('@features/warehouseInventory/pages/WarehouseInventoryListPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: ROUTE_PERMISSIONS.WAREHOUSES.VIEW,
    },
  }),

  defineRoute({
    path: '/inventory-allocations',
    component: lazy(
      () =>
        import('@features/inventoryAllocation/pages/InventoryAllocationPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: ROUTE_PERMISSIONS.INVENTORY_ALLOCATION.VIEW,
    },
  }),

  defineRoute({
    path: '/inventory-allocations/review/:orderId',
    component: lazy(
      () =>
        import('@features/inventoryAllocation/pages/InventoryAllocationReviewPage')
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
      () => import('@features/pricingType/pages/PricingTypeListPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: ROUTE_PERMISSIONS.PRICING_TYPES.VIEW,
    },
  }),
  
  defineRoute({
    path: '/pricing-types/:slug/:pricingTypeId',
    component: lazy(
      () => import('@features/pricingType/pages/PricingTypeDetailsPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: ROUTE_PERMISSIONS.PRICING_TYPES.VIEW_DETAILS,
    },
  }),

  defineRoute({
    path: '/prices',
    component: lazy(() => import('@features/pricing/pages/PricingListPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: ROUTE_PERMISSIONS.PRICING.VIEW,
    },
  }),

  defineRoute({
    path: '/location-types',
    component: lazy(
      () => import('@features/locationType/pages/LocationTypeListPage')
    ),
    meta: {
      requiresAuth: true,
      requiredPermission: ROUTE_PERMISSIONS.LOCATIONS_TYPES.VIEW,
    },
  }),

  defineRoute({
    path: '/locations',
    component: lazy(() => import('@features/location/pages/LocationListPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: ROUTE_PERMISSIONS.LOCATIONS.VIEW,
    },
  }),

  /* ---------- Reports ---------- */
  

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
      requiredPermission: ROUTE_PERMISSIONS.OUTBOUND_FULFILLMENTS.VIEW,
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
      requiredPermission: ROUTE_PERMISSIONS.OUTBOUND_FULFILLMENTS.VIEW_DETAILS,
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
