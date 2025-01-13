import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { routes } from './index';

const AppRoutes = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Routes>
      {routes.map(({ path, component }, index) => {
        const LazyComponent = lazy(component);
        return <Route key={index} path={path} element={<LazyComponent />} />;
      })}
    </Routes>
  </Suspense>
);

export default AppRoutes;
