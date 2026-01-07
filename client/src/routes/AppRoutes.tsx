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
import { usePermissions } from '@hooks/index';
import { PermissionsProvider } from '@context/PermissionsContext';

/**
 * Application routing entry point.
 *
 * Responsibilities:
 * - Fetch and provide permission state to the application
 * - Define route structure and access semantics
 * - Apply authentication and permission guards at the route level
 * - Render layout shells eagerly to improve LCP
 * - Handle lazy-loaded routes and global routing fallbacks
 *
 * Permission model:
 * - Permission fetching is asynchronous and non-blocking
 * - Initial renders may occur before permissions are fully resolved
 * - Permission readiness is exposed via `ready`
 * - Route guards are responsible for handling pending vs denied access
 *
 * Notes:
 * - This component MUST be the only place that calls `usePermissions`
 * - Providers are always mounted, even in error states
 * - UI components must not assume permissions are resolved on first render
 */
const AppRoutes = () => {
  // Resolve permissions once before route rendering
  const { roleName, permissions, error, ready } = usePermissions();

  return (
    <PermissionsProvider
      roleName={roleName}
      permissions={permissions}
      error={error}
      ready={ready}
    >
      {error ? (
        <ErrorDisplay>
          <ErrorMessage message={error} />
        </ErrorDisplay>
      ) : (
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
              
              return (
                <Route
                  key={path}
                  path={path}
                  element={<Component />}
                />
              );
            })}
            
            {/* Public */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      )}
    </PermissionsProvider>
  );
};

export default AppRoutes;
