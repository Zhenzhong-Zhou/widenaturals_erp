import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CustomButton from '@components/common//CustomButton';
import CustomTypography from '@components/common/CustomTypography';

const HomePage: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/login');
  };

  return (
    <Box>
      <CustomTypography>Welcome</CustomTypography>
      <CustomButton
        variant="contained"
        size="large"
        onClick={handleRedirect}
        sx={{
          textTransform: 'none',
          color: theme.palette.text.primary, // Button text color
          backgroundColor: theme.palette.primary.main, // Button background color
          '&:hover': {
            backgroundColor: theme.palette.primary.dark, // Button hover state
          },
        }}
      >
        Login
      </CustomButton>
    </Box>
  );
};

export default HomePage;
