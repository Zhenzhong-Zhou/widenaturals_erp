import { NavigationItem } from '@routes/index';

/**
 * Navigation configuration for the main application menu.
 *
 * - `path` maps to a route path
 * - `title` is the display label
 * - `requiredPermission` (optional) controls visibility based on user permissions
 *
 * Items without `requiredPermission` are visible to all authenticated users.
 */
export const navigationItems: NavigationItem[] = [
  { path: '/dashboard', title: 'Dashboard', exact: true },
  { path: '/users', title: 'Users', exact: true },
  { path: '/users/list', title: 'User Management' },
  { path: '/products', title: 'Product Management', exact: true },
  { path: '/product-catalog', title: 'Product Catalog' },
  { path: '/skus', title: 'SKU Management' },
  { path: '/compliance-records', title: 'Compliance Management' },
  { path: '/boms', title: 'BOM Management' },
  { path: '/batch-registry', title: 'Batch Registry' },
  {
    path: '/pricing-types',
    title: 'Pricing Types',
    requiredPermission: 'view_price_types',
  },
  {
    path: '/prices',
    title: 'Prices',
    requiredPermission: 'view_prices',
  },
  {
    path: '/locations',
    title: 'Locations',
    requiredPermission: 'view_locations',
  },
  {
    path: '/inventory-overview',
    title: 'Inventory Overview',
    requiredPermission: 'view_inventory_overview',
  },
  {
    path: '/warehouses',
    title: 'Warehouses',
    requiredPermission: 'view_warehouses',
  },
  {
    path: '/warehouse-inventory',
    title: 'Warehouse Inventory',
    requiredPermission: 'view_warehouses',
  },
  {
    path: '/reports/inventory-activity-logs',
    title: 'Inventory Activity Logs',
    requiredPermission: 'view_inventory_logs',
  },
  { path: '/customers', title: 'Customers' },
  { path: '/addresses', title: 'Addresses' },
  {
    path: '/orders',
    title: 'Orders',
    requiredPermission: 'view_orders',
    exact: true,
  },
  { path: '/order-types', title: 'Order Types' },
  {
    path: '/inventory-allocations',
    title: 'Inventory Allocation',
    requiredPermission: 'view_inventory_allocations',
  },
  {
    path: '/fulfillments',
    title: 'Fulfillment',
    requiredPermission: 'view_outbound_fulfillments',
  },
];
