import { useNavigate } from 'react-router-dom';
import Stack from '@mui/material/Stack';
import CustomTypography from '@components/common/CustomTypography';
import CustomButton from '@components/common/CustomButton';

const OrderLandingPage = () => {
  const navigate = useNavigate();
  
  return (
    <Stack spacing={3} p={4}>
      <CustomTypography variant="h4">Orders</CustomTypography>
      <CustomButton
        variant="contained"
        color="primary"
        onClick={() => navigate('/orders/sales/new')}
      >
        Create Sales Order
      </CustomButton>
    </Stack>
  );
};

export default OrderLandingPage;
