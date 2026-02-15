import { NavigationItem } from '@routes/index';
import ROUTE_PERMISSIONS from '@utils/constants/routePermissionConstants';

/**
 * Navigation configuration for the main application sidebar.
 *
 * - `path` maps to a registered application route
 * - `title` is the display label shown in the sidebar
 * - `requiredPermission` (optional) controls UI visibility only
 *
 * IMPORTANT:
 * - This configuration is for client-side rendering only.
 * - It does NOT grant access.
 * - Route-level protection is enforced by `PermissionGuard`.
 * - Backend authorization is enforced by server middleware.
 *
 * Items without `requiredPermission` are visible to all authenticated users.
 * Actual access control is always validated on the server.
 */
export const navigationItems: NavigationItem[] = [
  { path: '/dashboard', title: 'Dashboard', exact: true },

  // USERS
  {
    path: '/users',
    title: 'Users',
    exact: true,
    requiredPermission: ROUTE_PERMISSIONS.USERS.VIEW_CARD,
  },
  {
    path: '/users/list',
    title: 'User Management',
    requiredPermission: ROUTE_PERMISSIONS.USERS.VIEW_LIST,
  },

  // PRODUCTS
  {
    path: '/products',
    title: 'Product Management',
    exact: true,
    requiredPermission: ROUTE_PERMISSIONS.PRODUCTS.VIEW,
  },
  {
    path: '/product-catalog',
    title: 'Product Catalog',
    requiredPermission: ROUTE_PERMISSIONS.SKUS.VIEW_CARDS,
  },

  // SKU
  {
    path: '/skus',
    title: 'SKU Management',
    requiredPermission: ROUTE_PERMISSIONS.SKUS.VIEW_LIST,
  },

  // COMPLIANCE
  {
    path: '/compliance-records',
    title: 'Compliance Management',
    requiredPermission: ROUTE_PERMISSIONS.COMPLIANCE_RECORDS.VIEW_LIST,
  },

  // BOM
  {
    path: '/boms',
    title: 'BOM Management',
    requiredPermission: ROUTE_PERMISSIONS.BOMS.VIEW_LIST,
  },

  // BATCH
  {
    path: '/batch-registry',
    title: 'Batch Registry',
    requiredPermission: ROUTE_PERMISSIONS.BATCH_REGISTRY.VIEW_LIST,
  },
  {
    path: '/product-batches',
    title: 'Product Batches',
    requiredPermission: ROUTE_PERMISSIONS.PRODUCT_BATCH.VIEW_LIST,
  },

  // PRICING
  {
    path: '/pricing-types',
    title: 'Pricing Types',
    requiredPermission: ROUTE_PERMISSIONS.PRICING_TYPES.VIEW,
  },
  {
    path: '/prices',
    title: 'Prices',
    requiredPermission: ROUTE_PERMISSIONS.PRICING.VIEW,
  },

  // LOCATION
  {
    path: '/location-types',
    title: 'Location Types',
    requiredPermission: ROUTE_PERMISSIONS.LOCATIONS_TYPES.VIEW,
  },
  {
    path: '/locations',
    title: 'Locations',
    requiredPermission: ROUTE_PERMISSIONS.LOCATIONS.VIEW,
  },

  // INVENTORY
  {
    path: '/inventory-overview',
    title: 'Inventory Overview',
    requiredPermission: ROUTE_PERMISSIONS.WAREHOUSE_INVENTORY.VIEW_SUMMARY,
  },
  {
    path: '/warehouses',
    title: 'Warehouses',
    requiredPermission: ROUTE_PERMISSIONS.WAREHOUSE_INVENTORY.VIEW,
  },
  {
    path: '/warehouse-inventory',
    title: 'Warehouse Inventory',
    requiredPermission: ROUTE_PERMISSIONS.WAREHOUSE_INVENTORY.VIEW,
  },

  // REPORTS
  {
    path: '/reports/inventory-activity-logs',
    title: 'Inventory Activity Logs',
    requiredPermission: ROUTE_PERMISSIONS.REPORTS.VIEW_INVENTORY_LOGS,
  },

  // CUSTOMERS
  {
    path: '/customers',
    title: 'Customers',
    requiredPermission: ROUTE_PERMISSIONS.CUSTOMERS.VIEW,
  },
  {
    path: '/addresses',
    title: 'Addresses',
    requiredPermission: ROUTE_PERMISSIONS.ADDRESSES.VIEW,
  },

  // ORDERS
  {
    path: '/orders',
    title: 'Orders',
    exact: true,
    requiredPermission: ROUTE_PERMISSIONS.ORDERS.VIEW,
  },
  {
    path: '/order-types',
    title: 'Order Types',
    requiredPermission: ROUTE_PERMISSIONS.ORDER_TYPES.VIEW,
  },

  // INVENTORY ALLOCATION
  {
    path: '/inventory-allocations',
    title: 'Inventory Allocation',
    requiredPermission: ROUTE_PERMISSIONS.INVENTORY_ALLOCATION.VIEW,
  },

  // FULFILLMENT
  {
    path: '/fulfillments',
    title: 'Fulfillment',
    requiredPermission: ROUTE_PERMISSIONS.OUTBOUND_FULFILLMENTS.VIEW,
  },
];
