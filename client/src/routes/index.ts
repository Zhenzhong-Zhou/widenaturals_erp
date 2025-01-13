export const routes = [
  {
    path: '/',
    component: () => import('../pages/Dashboard'),
    meta: {
      requiresAuth: true,
      title: 'Dashboard',
    },
  },
];
