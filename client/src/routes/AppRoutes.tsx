import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { routes } from './index';
import ProtectedRoutes from './ProtectedRoutes.tsx';
import { Loading } from '@components/index.ts';

const AppRoutes = () => (
  <Suspense fallback={<Loading fullPage message="Loading page..." />}>
    <Routes>
      {routes.map(({ path, component, meta }, index) => {
        const LazyComponent = lazy(component);
        
        if (meta?.requiresAuth) {
          // Wrap protected routes
          return (
            <Route
              key={index}
              path={path}
              element={
                <ProtectedRoutes>
                  <LazyComponent />
                </ProtectedRoutes>
              }
            />
          );
        }
        
        // Render public routes
        return <Route key={index} path={path} element={<LazyComponent />} />;
      })}
    </Routes>
  </Suspense>
);

export default AppRoutes;
