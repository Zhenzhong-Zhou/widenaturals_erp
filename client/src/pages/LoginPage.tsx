import { FC } from 'react';
import { Box } from '@mui/material';
import LoginCard from '@components/common/LoginCard';

const LoginPage: FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'background.default', // Ensure this aligns with your theme
      }}
    >
      <LoginCard />
    </Box>
  );
};

export default LoginPage;
