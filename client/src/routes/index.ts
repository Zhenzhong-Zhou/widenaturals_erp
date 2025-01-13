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
      requiresAuth: true,
      title: 'Login',
    },
  },
];
