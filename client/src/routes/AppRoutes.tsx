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
import { useSession } from '@features/session/hooks';
import { usePermissions } from '@hooks/index';
import { PermissionsProvider } from '@context/PermissionsContext';

/**
 * AppRoutes
 *
 * Application routing composition and access orchestration layer.
 *
 * Responsibilities:
 * - Define the full application route structure
 * - Apply authentication, guest, and permission guards at the route level
 * - Mount global providers required for route evaluation
 * - Coordinate lazy-loaded routes and global fallbacks
 *
 * Permission model:
 * - Permission resolution is asynchronous and non-blocking
 * - Permission state is fetched once and provided via context
 * - Initial renders may occur before permissions are fully ready
 * - Access enforcement is delegated to PermissionGuard
 *
 * Session model:
 * - Route rendering is deferred until session resolution completes
 * - Authentication decisions are handled by route guards, not here
 *
 * Explicitly out of scope:
 * - Session bootstrap or refresh logic
 * - Redirect decisions based on business rules
 * - UI loading or skeleton strategies beyond Suspense
 *
 * Notes:
 * - This component MUST be the only place that calls `usePermissions`
 * - Providers are always mounted, even in permission error states
 * - Route components must tolerate permissions not being ready on first render
 */
const AppRoutes = () => {
  const { resolving } = useSession();
  
  // Resolve permissions once before route rendering
  const { roleName, permissions, error, ready } = usePermissions();
  
  // DO NOT render routes until session is resolved
  if (resolving) {
    return null; // or splash loader
  }

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
              const guestOnly = meta?.guestOnly === true;
              
              // Guest-only
              if (guestOnly) {
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
