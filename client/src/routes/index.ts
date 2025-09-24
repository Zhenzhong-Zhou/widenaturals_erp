import { lazy } from 'react';
import { ORDER_CONSTANTS, toPermissionValue } from '@utils/constants/orderPermissions';
import type { OrderRouteParams } from '@features/order/state';
import { isValidOrderCategory } from '@features/order/utils/orderCategoryUtils';

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
    // todo: not support nest route since i customize it.
    //  it may need to refactor whole routes logic and testing it again.
    //  leave it for now , it may refactor in the future.
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
    component: lazy(
      () => import('@features/pricing/pages/PricingListPage.tsx')
    ),
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
    component: lazy(
      () => import('@features/inventoryOverview/pages/InventoryOverviewPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Inventory Overview',
      showInSidebar: true,
      requiredPermission: 'view_inventory_overview',
    },
  },
  {
    path: '/location-inventory',
    component: lazy(
      () => import('@features/locationInventory/pages/LocationInventoryPage')
    ),
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
    path: '/warehouse_inventory',
    component: lazy(
      () => import('@features/warehouseInventory/pages/WarehouseInventoryPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Warehouse Inventory',
      showInSidebar: true,
      requiredPermission: 'view_warehouses',
    },
  },
  {
    path: '/reports/inventory-activity-logs',
    component: lazy(
      () => import('@features/report/pages/InventoryActivityLogsPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Inventory Activity Logs',
      showInSidebar: true,
      requiredPermission: 'view_inventory_logs',
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
    path: '/addresses',
    component: lazy(() => import('@features/address/pages/AddressesPage')),
    meta: { requiresAuth: true, title: 'Addresses', showInSidebar: true },
  },
  {
    path: '/order_types',
    component: lazy(() => import('@features/orderType/pages/OrderTypesPage')),
    meta: { requiresAuth: true, title: 'Order Types', showInSidebar: true },
  },
  {
    path: '/orders',
    component: lazy(() => import('@features/order/layouts/OrdersLayout')), // uses <Outlet />
    meta: {
      requiresAuth: true,
      title: 'Orders',
      showInSidebar: true,
      requiredPermission: 'view_orders',
    },
  },
  {
    path: '/orders/:mode/all',
    component: lazy(() => import('@features/order/pages/OrdersListPage')),
    meta: {
      requiresAuth: true,
      title: 'Order List',
      showInSidebar: false,
      requiredPermission: (params: { mode?: string }) =>
        params.mode && isValidOrderCategory(params.mode)
          ? toPermissionValue('VIEW', params.mode)
          : 'invalid_mode',
    },
  },
  {
    path: '/orders/:category/new',
    component: lazy(() => import('@features/order/pages/OrderBasePage')),
    meta: {
      requiresAuth: true,
      title: 'Base Page',
      showInSidebar: false,
      requiredPermission: (params: OrderRouteParams) =>
        isValidOrderCategory(params.category)
          ? toPermissionValue('VIEW', params.category)
          : 'invalid_category',
    },
  },
  {
    path: ':mode/:category/details/:orderId',
    component: lazy(() => import('@features/order/pages/OrderDetailsPage')),
    meta: {
      requiresAuth: true,
      title: 'Order Details',
      showInSidebar: false,
      requiredPermission: (params: OrderRouteParams) =>
        isValidOrderCategory(params.category)
          ? params.category === 'allocatable'
            ? ORDER_CONSTANTS.PERMISSIONS.ALLOCATION.VIEW
            : toPermissionValue('VIEW', params.category) // default
          : 'invalid_category',
    },
  },
  // {
  //   path: '/orders/:orderType/:orderId/edit',
  //   component: lazy(() => import('@features/order/pages/OrderDetailsPage')),
  //   meta: {
  //     requiresAuth: true,
  //     title: 'Order Details',
  //     showInSidebar: false,
  //     requiredPermission: 'view_sales_order_details',
  //   },
  // },
  {
    path: '/inventory-allocations/review/:orderId',
    component: lazy(
      () => import('@features/inventoryAllocation/pages/InventoryAllocationReviewPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Inventory Allocation Review',
      showInSidebar: false,
    },
  },
  {
    path: '/inventory-allocations',
    component: lazy(
      () =>
        import('@features/inventoryAllocation/pages/InventoryAllocationsPage')
    ),
    meta: {
      requiresAuth: true,
      title: 'Inventory Allocation',
      showInSidebar: true,
      requiredPermission: 'view_inventory_allocations',
    },
  },
  {
    path: '/fulfillments',
    component: lazy(() => import('@features/outboundFulfillment/pages/OutboundFulfillmentsListPage')),
    meta: {
      requiresAuth: true,
      title: 'Fulfillment',
      showInSidebar: true,
      requiredPermission: 'view_outbound_fulfillments',
    },
  },
  // {
  //   path: '/orders/transfers',
  //   component: lazy(() => import('@features/order/pages/OrderTransferPage')),
  //   meta: { requiresAuth: true, title: 'Transfers', showInSidebar: true },
  // },
  {
    path: '/access-denied',
    component: lazy(() => import('@pages/AccessDeniedPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: 'view_access_denied_page', // you can define this custom
    },
  },
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
