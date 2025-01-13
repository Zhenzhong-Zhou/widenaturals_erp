import { FC } from 'react';
import Box from '@mui/material/Box';
import { MainLayout } from '../layouts';
import { useInitializeApp } from '../hooks';
import AppRoutes from '../routes/AppRoutes'; // Import AppRoutes

const AppContent: FC = () => {
  useInitializeApp({ message: 'Initializing application...', delay: 3000 });
  
  return (
    <Box className="app">
      <MainLayout username="John Doe" onLogout={() => console.log('Logged out')}>
        <AppRoutes /> {/* Routes are rendered inside the MainLayout */}
      </MainLayout>
    </Box>
  );
};

export default AppContent;
