import { type FC } from 'react';
import type { DashboardPageProps } from '@features/dashboard';
import DashboardLayout from '@features/dashboard/components/DashboardLayout';
import Box from '@mui/material/Box';

const AdminDashboardPage: FC<DashboardPageProps> = ({ fullName }) => {
  return (
    <DashboardLayout fullName={fullName}>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 3 }}></Box>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
