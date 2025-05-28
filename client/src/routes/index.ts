import { lazy } from 'react';

export const routes = [
  {
    path: '/',
    component: lazy(() => import('@pages/HomePage')),
    meta: { requiresAuth: false, title: 'Home', showInSidebar: false },
  },
  {
    path: '/login',
    component: lazy(() => import('@features/session/pages/LoginPage')),
    meta: { requiresAuth: false, title: 'Login', showInSidebar: false },
  },
  {
    path: '/dashboard',
    component: lazy(() => import('@features/dashboard/pages/DashboardPage')),
    meta: { requiresAuth: true, title: 'Dashboard', showInSidebar: true },
  },
  {
    path: '/users',
    component: lazy(() => import('@features/user/pages/UsersPage')),
    meta: { requiresAuth: true, title: 'Users', showInSidebar: true },
  },
  {
    path: '/profile',
    component: lazy(() => import('@features/user/pages/UserProfilePage')),
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
    component: lazy(() => import('@features/product/pages/ProductsPage')),
    meta: { requiresAuth: true, title: 'Products', showInSidebar: true },
  },
  {
    path: '/products/:skuId',
    component: lazy(() => import('@features/product/pages/ProductDetailPage')),
    meta: {
      requiresAuth: true,
      title: 'Product Details',
      showInSidebar: false,
    },
  },
  {
    path: '/compliances',
    component: lazy(() => import('@features/compliance/pages/CompliancePage')),
    meta: { requiresAuth: true, title: 'Compliances', showInSidebar: true },
  },
  {
    path: '/pricing-types',
    component: lazy(
      () => import('@features/pricingType/pages/PricingTypePage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Pricing Types',
      showInSidebar: true,
      requiredPermission: 'view_prices',
    },
  },
  {
    path: '/pricing-types/:slug/:id',
    component: lazy(
      () => import('@features/pricingType/pages/PricingTypeDetailsPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Pricing Type Details',
      showInSidebar: false,
      requiredPermission: 'view_prices',
    },
  },
  {
    path: '/pricings',
    component: lazy(() => import('@features/pricing/pages/PricingListPage.tsx')),
    meta: {
      requiresAuth: true,
      title: 'Prices',
      showInSidebar: true,
      requiredPermission: 'view_prices',
    },
  },
  {
    path: '/pricings/:sku/:id',
    component: lazy(() => import('@features/pricing/pages/PricingDetailPage')),
    meta: {
      requiresAuth: true,
      title: 'Price Details',
      showInSidebar: false,
      requiredPermission: 'view_prices',
    },
  },
  {
    path: '/location_types',
    component: lazy(
      () => import('@features/locationType/pages/LocationTypePage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Location Types',
      showInSidebar: true,
      requiredPermission: 'view_locations',
    },
  },
  {
    path: '/location_types/:id',
    component: lazy(
      () => import('@features/locationType/pages/LocationTypeDetailPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Location Types Details',
      showInSidebar: false,
      requiredPermission: 'view_locations',
    },
  },
  {
    path: '/locations',
    component: lazy(() => import('@features/location/pages/LocationPage')),
    meta: {
      requiresAuth: true,
      title: 'Locations',
      showInSidebar: true,
      requiredPermission: 'view_locations',
    },
  },
  {
    path: '/inventory-overview',
    component: lazy(() => import('@features/inventoryOverview/pages/InventoryOverviewPage')),
    meta: {
      requiresAuth: true,
      title: 'Inventory Overview',
      showInSidebar: true,
      requiredPermission: 'view_inventory_overview',
    },
  },
  {
    path: '/location-inventory',
    component: lazy(() => import('@features/locationInventory/pages/LocationInventoryPage')),
    meta: {
      requiresAuth: true,
      title: 'Location Inventory',
      showInSidebar: true,
      requiredPermission: 'view_location_inventory',
    },
  },
  {
    path: '/warehouses',
    component: lazy(() => import('@features/warehouse/pages/WarehousesPage')),
    meta: {
      requiresAuth: true,
      title: 'Warehouses',
      showInSidebar: true,
      requiredPermission: 'view_warehouses',
    },
  },
  {
    path: '/warehouse_inventories',
    component: lazy(
      () => import('@features/warehouseInventory/pages/WarehouseInventoryPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Warehouse Inventories',
      showInSidebar: true,
      requiredPermission: 'view_warehouses',
    },
  },
  {
    path: '/reports/adjustments',
    component: lazy(
      () => import('@features/report/pages/AdjustmentReportPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Adjustment Report',
      showInSidebar: false,
      requiredPermission: 'view_adjustment_reports',
    },
  },
  {
    path: '/reports/adjustments/lot_adjustments/:warehouseId?/:inventoryId?/:warehouseInventoryLotId?',
    component: lazy(
      () => import('@features/report/pages/AdjustmentReportPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Adjustment Report',
      showInSidebar: false,
      requiredPermission: 'view_adjustment_reports',
    },
  },
  {
    path: '/reports/inventory_activities',
    component: lazy(
      () => import('@features/report/pages/InventoryActivityLogPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Inventory Activity Logs',
      showInSidebar: false,
      requiredPermission: 'view_inventory_activity_logs',
    },
  },
  {
    path: '/reports/inventory_activities/logs/:warehouseId?/:inventoryId?/:warehouseInventoryLotId?',
    component: lazy(
      () => import('@features/report/pages/InventoryActivityLogPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Inventory Activity Logs',
      showInSidebar: false,
      requiredPermission: 'view_inventory_activity_logs',
    },
  },
  {
    path: '/reports/inventory_histories',
    component: lazy(
      () => import('@features/report/pages/InventoryHistoryPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Inventory Activity Logs',
      showInSidebar: false,
      requiredPermission: 'view_inventory_activity_logs',
    },
  },
  {
    path: '/reports/inventory_histories/histories/:inventoryId?',
    component: lazy(
      () => import('@features/report/pages/InventoryHistoryPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Inventory Activity Logs',
      showInSidebar: false,
      requiredPermission: 'view_inventory_activity_logs',
    },
  },
  {
    path: '/customers',
    component: lazy(() => import('@features/customer/pages/CustomersPage')),
    meta: { requiresAuth: true, title: 'Customers', showInSidebar: true },
  },
  {
    path: '/customers/customer/:customerId',
    component: lazy(
      () => import('@features/customer/pages/CustomerDetailsPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Customer Details',
      showInSidebar: false,
      requiredPermission: 'view_customer',
    },
  },
  {
    path: '/order_types',
    component: lazy(() => import('@features/orderType/pages/OrderTypesPage')),
    meta: { requiresAuth: true, title: 'Order Types', showInSidebar: true },
  },
  {
    path: '/orders',
    component: lazy(() => import('@features/order/pages/OrdersPage')),
    meta: { requiresAuth: true, title: 'All Orders', showInSidebar: true },
  },
  {
    path: '/orders/:orderType/:orderId',
    component: lazy(() => import('@features/order/pages/OrderDetailsPage')),
    meta: {
      requiresAuth: true,
      title: 'Order Details',
      showInSidebar: false,
      requiredPermission: 'view_sales_order_details',
    },
  },
  {
    path: '/orders/:orderType/:orderId/edit',
    component: lazy(() => import('@features/order/pages/OrderDetailsPage')),
    meta: {
      requiresAuth: true,
      title: 'Order Details',
      showInSidebar: false,
      requiredPermission: 'view_sales_order_details',
    },
  },
  {
    path: '/orders/allocation-eligible',
    component: lazy(() => import('@features/order/pages/AllocationEligibleOrderPage')),
    meta: { requiresAuth: true, title: 'Allocation-Eligible Orders', showInSidebar: true },
  },
  {
    path: '/orders/:orderType/:orderId/allocate',
    component: lazy(() => import('@features/inventoryAllocation/pages/OrderInventoryAllocationPage')),
    meta: {
      requiresAuth: true,
      title: 'Inventory Allocation',
      showInSidebar: false,
      requiredPermission: 'inventory_allocation',
    },
  },
  // {
  //   path: '/orders/:type/:id/allocation',
  //   component: lazy(() => import('@features/order/pages/OrderAllocationDetailsPage')),
  //   meta: { requiresAuth: true, title: 'Order Allocation', showInSidebar: false },
  // },
  // {
  //   path: '/orders/fulfillment',
  //   component: lazy(() => import('@features/order/pages/OrderFulfillmentPage')),
  //   meta: { requiresAuth: true, title: 'Fulfillment', showInSidebar: true },
  // },
  // {
  //   path: '/orders/transfers',
  //   component: lazy(() => import('@features/order/pages/OrderTransferPage')),
  //   meta: { requiresAuth: true, title: 'Transfers', showInSidebar: true },
  // },
  {
    path: '*',
    component: lazy(() => import('@pages/NotFoundPage')),
    meta: {
      requiresAuth: false,
      title: '404 - Page Not Found',
      showInSidebar: false,
    },
  },
];
