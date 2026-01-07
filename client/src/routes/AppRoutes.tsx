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
 * Responsibilities:
 * - Resolve and provide permission state to the application
 * - Define route structure and access semantics
 * - Apply authentication and permission guards at the route level
 * - Render layout shells before guard evaluation for improved LCP
 * - Handle lazy-loaded routes and global routing fallbacks
 *
 * Notes:
 * - Permission resolution is non-blocking and does NOT gate initial rendering
 * - Layout components are rendered eagerly to avoid delaying first paint
 * - Guards are responsible for access control, not UI blocking
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
                    <MainLayout>
                      <ProtectedRoutes>
                        <PermissionGuard
                          requiredPermission={meta?.requiredPermission}
                        >
                          <Component />
                        </PermissionGuard>
                      </ProtectedRoutes>
                    </MainLayout>
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
