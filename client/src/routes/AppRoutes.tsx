import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { routes } from './index';
import ProtectedRoutes from './ProtectedRoutes.tsx';
import GuestRoute from './GuestRoute.tsx';
import { ErrorDisplay, ErrorMessage, Loading } from '@components/index.ts';
import { MainLayout } from '../layouts';
import { usePermissions, useSession } from '../hooks';
import { PermissionsProvider } from '../context';
import { hasPermission } from '@utils/permissionUtils.ts';

const LazyNotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((module) => ({
    default: module.default,
  }))
);

const AppRoutes = () => {
  const { isAuthenticated } = useSession(); // Fetch authentication state
  const { roleName, permissions, error } = usePermissions(); // Fetch permissions

  if (error) {
    return (
      <ErrorDisplay>
        <ErrorMessage message={error} />
      </ErrorDisplay>
    );
  }

  return (
    <PermissionsProvider
      roleName={roleName}
      permissions={permissions}
      error={error}
    >
      <Suspense fallback={<Loading fullPage message="Loading page..." />}>
        <Routes>
          {routes.map(({ path, component, meta }, index) => {
            const LazyComponent = lazy(() =>
              component().then((module) => ({ default: module.default }))
            );

            if (meta?.requiresAuth) {
              if (
                !hasPermission(meta.requiredPermission, permissions, roleName)
              ) {
                // Render "Access Denied" if the user lacks permission
                return (
                  <Route
                    key={index}
                    path={path}
                    element={
                      <MainLayout>
                        <ErrorDisplay>
                          <ErrorMessage message="Access Denied" />
                        </ErrorDisplay>
                      </MainLayout>
                    }
                  />
                );
              }

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
            return (
              <Route key={index} path={path} element={<LazyComponent />} />
            );
          })}

          {/* 404 Page for Invalid Routes */}
          <Route
            path="*"
            element={<LazyNotFoundPage isAuthenticated={isAuthenticated} />}
          />
        </Routes>
      </Suspense>
    </PermissionsProvider>
  );
};

export default AppRoutes;
