export const routes = [
  {
    path: '/',
    component: () => import('../pages/DashboardPage'),
    meta: {
      requiresAuth: true,
      title: 'Dashboard',
    },
  },
  {
    path: '/login',
    component: () => import('../features/auth/pages/LoginPage.tsx'),
    meta: {
      requiresAuth: false,
      title: 'Login',
    },
  },
  // {
  //   path: '*',
  //   component: () => import('../pages/NotFoundPage'),
  //   meta: {
  //     requiresAuth: false,
  //     title: '404 - Page Not Found',
  //   },
  // }
];
