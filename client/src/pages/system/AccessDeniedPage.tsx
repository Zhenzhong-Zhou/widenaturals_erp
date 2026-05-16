import { useNavigate } from 'react-router-dom';
import { Box, Container, Stack } from '@mui/material';
import { CustomButton, CustomTypography } from '@components/index';

const AccessDeniedPage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '65vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 8,
        }}
      >
        <Stack
          spacing={3}
          sx={{
            alignItems: 'center',
          }}
        >
          <CustomTypography variant="h3" color="error" sx={{ fontWeight: 600 }}>
            Access Denied
          </CustomTypography>
          <CustomTypography variant="body1">
            You do not have permission to view this page.
          </CustomTypography>
          <CustomButton
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </CustomButton>
        </Stack>
      </Box>
    </Container>
  );
};

export default AccessDeniedPage;
