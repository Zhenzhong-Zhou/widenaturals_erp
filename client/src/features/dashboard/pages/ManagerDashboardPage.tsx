import { FC } from 'react';
import { Box } from '@mui/material';
import { CustomButton, Typography } from '@components/index.ts';
import { useNavigate } from 'react-router-dom';

const UserDashboardPage: FC<{ roleName: string; permissions: string[] }> = ({
  roleName,
  permissions,
}) => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to the User Dashboard, {roleName}!
      </Typography>

      <Typography variant="body1" gutterBottom>
        Your Permissions:
      </Typography>
      <ul>
        {permissions.map((permission, index) => (
          <li key={index}>{permission}</li>
        ))}
      </ul>

      <Typography variant="body1">
        This is the dashboard specifically tailored for users. Here, you can
        access reports, manage your profile, and view notifications.
      </Typography>
      
      <CustomButton
        variant="contained"
        color="primary"
        onClick={() => navigate('/reports/adjustments')}
      >
        View Adjustment Report
      </CustomButton>
    </Box>
  );
};

export default UserDashboardPage;
