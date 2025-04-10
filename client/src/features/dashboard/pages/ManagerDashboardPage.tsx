import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardPageProps } from '@features/dashboard';
import DashboardLayout from '@features/dashboard/components/DashboardLayout';
import Typography from '@components/common/Typography';
import CustomButton from '@components/common/CustomButton';
import PermissionList from '@features/dashboard/components/PermissionList';

const ManagerDashboardPage: FC<DashboardPageProps> = ({
  fullName = 'Unknown User',
  permissions = [],
}) => {
  const navigate = useNavigate();

  return (
    <DashboardLayout fullName={fullName}>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Your Permissions:
      </Typography>
      <PermissionList permissions={permissions} />
      <CustomButton
        variant="contained"
        color="primary"
        onClick={() => navigate('/reports/adjustments')}
      >
        View Adjustment Report
      </CustomButton>
      <CustomButton
        variant="contained"
        color="primary"
        onClick={() => navigate('/reports/inventory_activities')}
      >
        View Inventory Activity Logs
      </CustomButton>
    </DashboardLayout>
  );
};

export default ManagerDashboardPage;
