import { Suspense, lazy } from 'react';
import { matchPath, Route, Routes } from 'react-router-dom';
import { Navigate } from 'react-router';
import { routes } from '@routes/index';
import ProtectedRoutes from '@routes/ProtectedRoutes';
import GuestRoute from '@routes/GuestRoute';
import useSession from '@hooks/useSession';
import usePermissions from '@hooks/usePermissions';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import { PermissionsProvider } from '@context/PermissionsContext';
import Loading from '@components/common/Loading';
import MainLayout from '@layouts/MainLayout/MainLayout';
import { hasPermission } from '@utils/permissionUtils';
import { resolvePermission } from '@utils/routeUtils';

const LazyNotFoundPage = lazy(() =>
  import('@pages/NotFoundPage').then((module) => ({
    default: module.default,
  }))
);

const LazyAccessDeniedPage = lazy(() =>
  import('@pages/AccessDeniedPage').then((module) => ({
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
          {routes.map(({ path, component: LazyComponent, meta }, index) => {
            const isProtected = meta?.requiresAuth;
            const isAccessDeniedRoute = path === '/access-denied';

            const match = matchPath(path, window.location.pathname); // Get params
            const routeParams = match?.params ?? {};
            const resolvedPermission = resolvePermission(
              meta?.requiredPermission,
              routeParams
            );

            // Block direct access to /access-denied for non-root_admin/admin
            if (roleName && isAccessDeniedRoute && roleName !== 'root_admin') {
              return (
                <Route
                  key={index}
                  path={path}
                  element={<Navigate to="/" replace />}
                />
              );
            }

            // Protected route
            if (isProtected) {
              if (!hasPermission(resolvedPermission, permissions, roleName)) {
                return (
                  <Route
                    key={index}
                    path={path}
                    element={
                      <MainLayout>
                        <LazyAccessDeniedPage />
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

            // Guest routes
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
