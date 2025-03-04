import { FC, ReactNode } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@components/index.ts';

interface BaseDashboardLayoutProps {
  fullName: string;
  children: ReactNode;
}

const DashboardLayout: FC<BaseDashboardLayoutProps> = ({
  fullName,
  children,
}) => {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {fullName}!
      </Typography>
      {children}
    </Box>
  );
};

export default DashboardLayout;
