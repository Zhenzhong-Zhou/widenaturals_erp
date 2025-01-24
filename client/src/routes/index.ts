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
    path: '*',
    component: () => import('../pages/NotFoundPage'),
    meta: {
      requiresAuth: false,
      title: '404 - Page Not Found',
      showInSidebar: false, // Exclude from sidebar
    },
  },
  {
    path: '/dashboard',
    component: () => import('../pages/DashboardPage'),
    meta: {
      requiresAuth: true,
      title: 'Dashboard',
      showInSidebar: true, // Include in sidebar
    },
  },
  {
    path: '/users',
    component: () => import('../features/user/pages/UsersPage'),
    meta: {
      requiresAuth: true,
      title: 'Users',
      showInSidebar: true, // Include in sidebar
    },
  },
  {
    path: '/profile',
    component: () => import('../features/user/pages/UserProfilePage.tsx'),
    meta: {
      requiresAuth: true,
      title: 'User Profile',
      showInSidebar: false, // Exclude from sidebar
    },
    children: [
      {
        path: '', // Default child route
        // component: () => import('../features/user/pages/UserProfile.tsx'),
        meta: { title: 'User Profile' },
      },
      {
        path: 'edit',
        // component: () => import('../features/user/pages/EditProfile.tsx'),
        meta: { title: 'Edit Profile' },
      },
    ],
  },
];
