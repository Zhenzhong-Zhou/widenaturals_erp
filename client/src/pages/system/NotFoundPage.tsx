import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import Container from '@mui/material/Container';
import {
  CustomButton,
  CustomTypography,
  GoBackButton
} from '@components/index';
import { useSession } from '@features/session/hooks';

const NotFoundPage: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, bootstrapped } = useSession();
  
  // Prevent incorrect redirect target before bootstrap completes
  if (!bootstrapped) {
    return null;
  }
  
  const handleRedirect = () => {
    navigate(isAuthenticated ? '/dashboard' : '/');
  };
  
  return (
    <Container
      maxWidth="md"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100vh',
        textAlign: 'center',
        paddingTop: '30vh',
      }}
    >
      <CustomTypography
        variant="h1"
        sx={{
          fontWeight: 'bold',
          mb: 2,
          color: theme.palette.primary.main,
        }}
      >
        404
      </CustomTypography>
      
      <CustomTypography
        variant="h4"
        sx={{
          mb: 4,
          color: theme.palette.text.secondary,
        }}
      >
        {isAuthenticated
          ? 'Sorry, we couldn’t find the page you’re looking for.'
          : 'Oops! The page you are looking for doesn’t exist.'}
      </CustomTypography>
      
      <CustomButton
        variant="contained"
        size="large"
        onClick={handleRedirect}
        sx={{
          textTransform: 'none',
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        }}
      >
        {isAuthenticated ? 'Go Back to Dashboard' : 'Go Back to Home'}
      </CustomButton>
      
      <GoBackButton />
    </Container>
  );
};

export default NotFoundPage;
