export const routes = [
  {
    path: '/',
    component: () => import('../pages/HomePage.tsx'),
    meta: {
      requiresAuth: false,
      title: 'Home',
      showInSidebar: false,
    },
  },
  {
    path: '/login',
    component: () => import('../features/session/pages/LoginPage.tsx'),
    meta: {
      requiresAuth: false,
      title: 'Login',
      showInSidebar: false,
    },
  },
  {
    path: '/dashboard',
    component: () => import('../features/dashboard/pages/DashboardPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Dashboard',
      showInSidebar: true,
      // requiredPermission: '',
    },
  },
  {
    path: '/users',
    component: () => import('../features/user/pages/UsersPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Users',
      showInSidebar: true,
    },
  },
  {
    path: '/profile',
    component: () => import('../features/user/pages/UserProfilePage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'User Profile',
      showInSidebar: false,
    },
    children: [
      {
        path: '',
        // component: () => import('../features/user/pages/UserProfile.tsx'),
        meta: {
          title: 'View Profile',
        },
      },
      {
        path: 'edit',
        // component: () => import('../features/user/pages/EditProfile.tsx'),
        meta: {
          title: 'Edit Profile',
          // requiredPermission: 'edit_profile', // Permission for edit access
        },
      },
    ],
  },
  {
    path: '/products',
    component: () => import('../features/product/pages/ProductsPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Products',
      showInSidebar: true,
    },
  },
  {
    path: '/products/:id',
    component: () => import('../features/product/pages/ProductDetailPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Product Details',
      showInSidebar: false,
    },
  },
  {
    path: '/pricing_types',
    component: () => import('../features/pricingTypes/pages/PricingTypePage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Pricing Types',
      showInSidebar: true,
    },
    requiredPermission: 'view_prices',
  },
  {
    path: '/pricing_types/:id',
    component: () => import('../features/pricingTypes/pages/PricingTypeDetailsPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Pricing Type Details',
      showInSidebar: false,
      requiredPermission: 'view_prices',
    },
  },
  {
    path: '/pricings',
    component: () => import('../features/pricing/pages/PricingPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Prices',
      showInSidebar: true,
      requiredPermission: 'view_prices',
    },
  },
  {
    path: '/pricings/:id',
    component: () => import('../features/pricing/pages/PricingDetailPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Price Details',
      showInSidebar: false,
      requiredPermission: 'view_prices',
    },
  },
  {
    path: '/location_types',
    component: () => import('../features/locationTypes/pages/LocationTypePage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Location Types',
      showInSidebar: true,
      requiredPermission: 'view_locations',
    },
  },
  {
    path: '/location_types/:id',
    component: () => import('../features/locationTypes/pages/LocationTypeDetailPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Location Types Details',
      showInSidebar: false,
      requiredPermission: 'view_locations',
    },
  },
  {
    path: '/locations',
    component: () => import('../features/location/pages/LocationPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Locations',
      showInSidebar: true,
      requiredPermission: 'view_locations',
    },
  },
  {
    path: '/inventories',
    component: () => import('../features/inventory/pages/InventoryPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Inventories',
      showInSidebar: true,
      requiredPermission: 'view_inventories',
    },
  },
  {
    path: '/warehouses',
    component: () => import('../features/warehouse/pages/WarehousesPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Warehouses',
      showInSidebar: true,
      requiredPermission: 'view_warehouses',
    },
  },
  {
    path: '/warehouse_inventories',
    component: () => import('../features/warehouse-inventory/pages/WarehouseInventoryPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Warehouse Inventories',
      showInSidebar: true,
      requiredPermission: 'view_warehouses',
    },
  },
  {
    path: '/warehouse_inventories/:warehouseId',
    component: () => import('../features/warehouse-inventory/pages/WarehouseInventoryDetailPage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'Warehouse Inventories Details',
      showInSidebar: false,
      requiredPermission: 'view_warehouses',
    },
  },
  {
    path: '*',
    component: () => import('../pages/NotFoundPage.tsx'),
    meta: {
      requiresAuth: false,
      title: '404 - Page Not Found',
      showInSidebar: false,
    },
  },
];
