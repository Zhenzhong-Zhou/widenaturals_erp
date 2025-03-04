import { FC } from 'react';
import { CustomButton, Typography } from '@components/index.ts';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, DashboardPageProps, PermissionList } from '../index.ts';

const ManagerDashboardPage: FC<DashboardPageProps> = ({ fullName, permissions }) => {
  const navigate = useNavigate();
  
  return (
    <DashboardLayout fullName={fullName}>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Your Permissions:
      </Typography>
      <PermissionList permissions={permissions} />
      <CustomButton variant="contained" color="primary" onClick={() => navigate('/reports/adjustments')}>
        View Adjustment Report
      </CustomButton>
    </DashboardLayout>
  );
};

export default ManagerDashboardPage;
