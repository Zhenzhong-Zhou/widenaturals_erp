import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  appRoutes,
  GuestRoute,
  PermissionGuard,
  ProtectedRoutes,
} from '@routes/index';
import MainLayout from '@layouts/MainLayout/MainLayout';
import Loading from '@components/common/Loading';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import usePermissions from '@hooks/usePermissions';
import { PermissionsProvider } from '@context/PermissionsContext';

/**
 * Application routing entry point.
 *
 * - Initializes permission context
 * - Applies auth, guest, and permission guards
 * - Wraps protected routes with the main layout
 * - Handles global routing fallback and lazy loading
 */
const AppRoutes = () => {
  // Resolve permissions once before route rendering
  const { roleName, permissions, error } = usePermissions();

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
      <Suspense
        fallback={<Loading size={24} variant="spinner" message="Loading…" />}
      >
        <Routes>
          {appRoutes.map(({ path, component: Component, meta }) => {
            const requiresAuth = meta?.requiresAuth === true;
            // Guest-only
            if (path === '/' || path === '/login') {
              return (
                <Route
                  key={path}
                  path={path}
                  element={
                    <GuestRoute>
                      <Component />
                    </GuestRoute>
                  }
                />
              );
            }

            // Protected
            if (requiresAuth) {
              return (
                <Route
                  key={path}
                  path={path}
                  element={
                    <ProtectedRoutes>
                      <MainLayout>
                        <PermissionGuard
                          requiredPermission={meta?.requiredPermission}
                        >
                          <Component />
                        </PermissionGuard>
                      </MainLayout>
                    </ProtectedRoutes>
                  }
                />
              );
            }

            // Public
            return <Route key={path} path={path} element={<Component />} />;
          })}

          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </PermissionsProvider>
  );
};

export default AppRoutes;
