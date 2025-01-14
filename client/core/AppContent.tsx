import { FC } from 'react';
import Box from '@mui/material/Box';
import { MainLayout } from '../src/layouts';
import { useInitializeApp } from '../src/hooks';
import AppRoutes from '../src/routes/AppRoutes';

const AppContent: FC = () => {
  // Initialize the app with global loading
  useInitializeApp({ message: 'Initializing application...', delay: 500 });
  
  return (
    <Box className="app">
      <MainLayout username="John Doe" onLogout={() => console.log('Logged out')}>
        <AppRoutes /> {/* Routes are rendered inside the MainLayout */}
      </MainLayout>
    </Box>
  );
};

export default AppContent;
