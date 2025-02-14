import { FC } from 'react';
import { Box } from '@mui/material';
import { Typography } from '@components/index.ts';

const UserDashboardPage: FC<{ roleName: string; permissions: string[] }> = ({
  roleName,
  permissions,
}) => {
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
    </Box>
  );
};

export default UserDashboardPage;
