import { FC } from 'react';
import { CustomButton } from '@components/index.ts';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, DashboardPageProps } from '../index.ts';

const AdminDashboardPage: FC<DashboardPageProps> = ({ fullName }) => {
  const navigate = useNavigate();

  return (
    <DashboardLayout fullName={fullName}>
      <CustomButton
        variant="contained"
        color="primary"
        onClick={() => navigate('/reports/adjustments')}
      >
        View Adjustment Report
      </CustomButton>
    </DashboardLayout>
  );
};

export default AdminDashboardPage;
