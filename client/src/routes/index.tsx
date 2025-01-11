import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Dashboard from '../pages/Dashboard.tsx';

const AppRoutes = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Routes>
      <Route path="/" element={<Dashboard/>} />
      {/*<Route path="/reports" element={<React.lazy(() => import('../pages/Reports'))} />*/}
    </Routes>
  </Suspense>
);

export default AppRoutes;
