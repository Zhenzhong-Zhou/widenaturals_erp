import { FC } from 'react';
import Box from '@mui/material/Box';
import { MainLayout } from '../layouts';
import { useInitializeApp } from '../hooks';

const AppContent: FC = () => {
  useInitializeApp({ message: 'Loading app...', delay: 3000 });
  
  return (
    <Box className="app">
      <MainLayout username="" onLogout={() => console.log('Logged out')} children={undefined} />
    </Box>
  );
};

export default AppContent;
