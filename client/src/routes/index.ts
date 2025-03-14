import { lazy } from 'react';

export const routes = [
  {
    path: '/',
    component: lazy(() => import('../pages/HomePage.tsx')),
    meta: { requiresAuth: false, title: 'Home', showInSidebar: false },
  },
  {
    path: '/login',
    component: lazy(() => import('../features/session/pages/LoginPage.tsx')),
    meta: { requiresAuth: false, title: 'Login', showInSidebar: false },
  },
  {
    path: '/dashboard',
    component: lazy(() => import('../features/dashboard/pages/DashboardPage.tsx')),
    meta: { requiresAuth: true, title: 'Dashboard', showInSidebar: true },
  },
  {
    path: '/users',
    component: lazy(() => import('../features/user/pages/UsersPage.tsx')),
    meta: { requiresAuth: true, title: 'Users', showInSidebar: true },
  },
  {
    path: '/profile',
    component: lazy(() => import('../features/user/pages/UserProfilePage.tsx')),
    meta: { requiresAuth: true, title: 'User Profile', showInSidebar: false },
    children: [
      {
        path: '',
        meta: { title: 'View Profile' },
      },
      {
        path: 'edit',
        meta: { title: 'Edit Profile', requiredPermission: 'edit_profile' },
      },
    ],
  },
  {
    path: '/products',
    component: lazy(() => import('../features/product/pages/ProductsPage.tsx')),
    meta: { requiresAuth: true, title: 'Products', showInSidebar: true },
  },
  {
    path: '/products/:id',
    component: lazy(() => import('../features/product/pages/ProductDetailPage.tsx')),
    meta: { requiresAuth: true, title: 'Product Details', showInSidebar: false },
  },
  {
    path: '/compliances',
    component: lazy(() => import('../features/compliance/pages/CompliancePage.tsx')),
    meta: { requiresAuth: true, title: 'Compliances', showInSidebar: true },
  },
  {
    path: '/pricing_types',
    component: lazy(() => import('../features/pricingTypes/pages/PricingTypePage.tsx')),
    meta: { requiresAuth: true, title: 'Pricing Types', showInSidebar: true, requiredPermission: 'view_prices' },
  },
  {
    path: '/pricing_types/:id',
    component: lazy(() => import('../features/pricingTypes/pages/PricingTypeDetailsPage.tsx')),
    meta: { requiresAuth: true, title: 'Pricing Type Details', showInSidebar: false, requiredPermission: 'view_prices' },
  },
  {
    path: '/pricings',
    component: lazy(() => import('../features/pricing/pages/PricingPage.tsx')),
    meta: { requiresAuth: true, title: 'Prices', showInSidebar: true, requiredPermission: 'view_prices' },
  },
  {
    path: '/pricings/:id',
    component: lazy(() => import('../features/pricing/pages/PricingDetailPage.tsx')),
    meta: { requiresAuth: true, title: 'Price Details', showInSidebar: false, requiredPermission: 'view_prices' },
  },
  {
    path: '/location_types',
    component: lazy(() => import('../features/locationTypes/pages/LocationTypePage.tsx')),
    meta: { requiresAuth: true, title: 'Location Types', showInSidebar: true, requiredPermission: 'view_locations' },
  },
  {
    path: '/location_types/:id',
    component: lazy(() => import('../features/locationTypes/pages/LocationTypeDetailPage.tsx')),
    meta: { requiresAuth: true, title: 'Location Types Details', showInSidebar: false, requiredPermission: 'view_locations' },
  },
  {
    path: '/locations',
    component: lazy(() => import('../features/location/pages/LocationPage.tsx')),
    meta: { requiresAuth: true, title: 'Locations', showInSidebar: true, requiredPermission: 'view_locations' },
  },
  {
    path: '/inventories',
    component: lazy(() => import('../features/inventory/pages/InventoryPage.tsx')),
    meta: { requiresAuth: true, title: 'Inventories', showInSidebar: true, requiredPermission: 'view_inventories' },
  },
  {
    path: '/warehouses',
    component: lazy(() => import('../features/warehouse/pages/WarehousesPage.tsx')),
    meta: { requiresAuth: true, title: 'Warehouses', showInSidebar: true, requiredPermission: 'view_warehouses' },
  },
  {
    path: '/warehouse_inventories',
    component: lazy(() => import('../features/warehouse-inventory/pages/WarehouseInventoryPage.tsx')),
    meta: { requiresAuth: true, title: 'Warehouse Inventories', showInSidebar: true, requiredPermission: 'view_warehouses' },
  },
  {
    path: '/warehouse_inventories/:warehouseId',
    component: lazy(() => import('../features/warehouse-inventory/pages/WarehouseInventoryDetailPage.tsx')),
    meta: { requiresAuth: true, title: 'Warehouse Inventories Details', showInSidebar: false, requiredPermission: 'view_warehouses' },
  },
  {
    path: '/reports/adjustments',
    component: lazy(() => import('../features/report/pages/AdjustmentReportPage.tsx')),
    meta: { requiresAuth: true, title: 'Adjustment Report', showInSidebar: false, requiredPermission: 'view_adjustment_reports' },
  },
  {
    path: '/reports/adjustments/lot_adjustments/:warehouseId?/:inventoryId?/:warehouseInventoryLotId?',
    component: lazy(() =>
      import('../features/report/pages/AdjustmentReportPage.tsx')),
    meta: {
      requiresAuth: true,
      title: 'Adjustment Report',
      showInSidebar: false,
      requiredPermission: 'view_adjustment_reports',
    },
  },
  {
    path: '/reports/inventory_activities',
    component: lazy(() => import('../features/report/pages/InventoryActivityLogPage.tsx')),
    meta: { requiresAuth: true, title: 'Inventory Activity Logs', showInSidebar: false, requiredPermission: 'view_inventory_activity_logs' },
  },
  {
    path: '/reports/inventory_activities/logs/:warehouseId?/:inventoryId?/:warehouseInventoryLotId?',
    component: lazy(() =>
      import('../features/report/pages/InventoryActivityLogPage.tsx')),
    meta: {
      requiresAuth: true,
      title: 'Inventory Activity Logs',
      showInSidebar: false,
      requiredPermission: 'view_inventory_activity_logs',
    },
  },
  {
    path: '/reports/inventory_histories',
    component: lazy(() => import('../features/report/pages/InventoryHistoryPage.tsx')),
    meta: { requiresAuth: true, title: 'Inventory Activity Logs', showInSidebar: false, requiredPermission: 'view_inventory_activity_logs' },
  },
  {
    path: '/reports/inventory_histories/histories/:inventoryId?',
    component: lazy(() =>
      import('../features/report/pages/InventoryHistoryPage.tsx')),
    meta: {
      requiresAuth: true,
      title: 'Inventory Activity Logs',
      showInSidebar: false,
      requiredPermission: 'view_inventory_activity_logs',
    },
  },
  {
    path: '/customers',
    component: lazy(() => import('../features/customer/pages/CustomersPage.tsx')),
    meta: { requiresAuth: true, title: 'Customers', showInSidebar: true },
  },
  {
    path: '/customers/customer/:customerId',
    component: lazy(() => import('../features/customer/pages/CustomerDetailsPage.tsx')),
    meta: { requiresAuth: true, title: 'Customer Details', showInSidebar: false, requiredPermission: 'view_customer' },
  },
  {
    path: '/order_types',
    component: lazy(() => import('../features/orderType/pages/OrderTypesPage.tsx')),
    meta: { requiresAuth: true, title: 'Order Types', showInSidebar: true },
  },
  {
    path: '/orders',
    component: lazy(() => import('../features/order/pages/OrdersPage.tsx')),
    meta: { requiresAuth: true, title: 'Orders', showInSidebar: true },
  },
  {
    path: '*',
    component: lazy(() => import('../pages/NotFoundPage.tsx')),
    meta: { requiresAuth: false, title: '404 - Page Not Found', showInSidebar: false },
  },
];
