import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { routes } from './index';
import ProtectedRoutes from './ProtectedRoutes.tsx';
import GuestRoute from './GuestRoute.tsx';
import { Loading } from '@components/index.ts';
import { MainLayout } from '../layouts';
import { useSession } from '../hooks';

const LazyNotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((module) => ({
    default: module.default,
  }))
);

const AppRoutes = () => {
  const { isAuthenticated } = useSession(); // Fetch isAuth state

  return (
    <Suspense fallback={<Loading fullPage message="Loading page..." />}>
      <Routes>
        {routes.map(({ path, component, meta }, index) => {
          const LazyComponent = lazy(() =>
            component().then((module) => ({ default: module.default }))
          );

          if (meta?.requiresAuth) {
            // Wrap protected routes
            return (
              <Route
                key={index}
                path={path}
                element={
                  <ProtectedRoutes>
                    <MainLayout>
                      <LazyComponent />
                    </MainLayout>
                  </ProtectedRoutes>
                }
              />
            );
          }

          if (path === '/login' || path === '/') {
            // Wrap login and homepage with GuestRoute
            return (
              <Route
                key={index}
                path={path}
                element={
                  <GuestRoute>
                    <LazyComponent />
                  </GuestRoute>
                }
              />
            );
          }

          // Render other public routes directly
          return <Route key={index} path={path} element={<LazyComponent />} />;
        })}

        {/* 404 Page for Invalid Routes */}
        <Route
          path="*"
          element={<LazyNotFoundPage isAuthenticated={isAuthenticated} />}
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
