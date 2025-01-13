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
    component: () => import('../pages/LoginPage'),
    meta: {
      requiresAuth: true,
      title: 'Login',
    },
  },
];
