import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DashboardPageProps } from '@features/dashboard';
import DashboardLayout from '@features/dashboard/components/DashboardLayout';
import CustomButton from '@components/common/CustomButton';

const AdminDashboardPage: FC<DashboardPageProps> = ({ fullName }) => {
  const navigate = useNavigate();

  return (
    <DashboardLayout fullName={fullName} showInventorySummary={true}>
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
      <CustomButton
        variant="contained"
        color="primary"
        onClick={() => navigate('/reports/inventory_histories')}
      >
        View Inventory History
      </CustomButton>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
