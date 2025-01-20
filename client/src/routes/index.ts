export const routes = [
  {
    path: '/',
    component: () => import('../pages/HomePage.tsx'),
    meta: {
      requiresAuth: false,
      title: 'Home',
    },
  },
  {
    path: '/login',
    component: () => import('../features/session/pages/LoginPage.tsx'),
    meta: {
      requiresAuth: false,
      title: 'Login',
    },
  },
  {
    path: '*',
    component: () => import('../pages/NotFoundPage'),
    meta: {
      requiresAuth: false,
      title: '404 - Page Not Found',
    },
  },
  {
    path: '/dashboard',
    component: () => import('../pages/DashboardPage'),
    meta: {
      requiresAuth: true,
      title: 'Dashboard',
    },
  },
];
