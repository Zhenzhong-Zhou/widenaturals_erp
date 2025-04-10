import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CustomTypography from '@components/common/CustomTypography';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import ErrorMessage from '@components/common/ErrorMessage';
import GoBackButton from '@components/common/GoBackButton';
import SalesOrderDetailsSection from '@features/order/components/SalesOrderDetailsSection';

const OrderDetailsPage: FC = () => {
  // Get the `orderType` and `orderId` from the URL
  const { orderType, orderId } = useParams<{ orderType: string; orderId: string }>();
  const location = useLocation();
  const state = location.state as { orderNumber?: string };
  
  if (!orderType || !orderId) {
    return (
      <ErrorDisplay>
        <ErrorMessage message={"Invalid URL. Please check the link and try again."}/>
      </ErrorDisplay>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <CustomTypography variant="h4" sx={{ marginBottom: 2 }}>
        {state?.orderNumber} - Order Information
      </CustomTypography>
      
      {/* Actions Row */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <GoBackButton />
      </Stack>
      
      {/* Order Details */}
      <SalesOrderDetailsSection orderId={orderId} />
    </Box>
  );
};

export default OrderDetailsPage;
