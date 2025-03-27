import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { SalesOrderDetailsSection } from '../index.ts';
import Box from '@mui/material/Box';
import Typography from '@components/common/Typography.tsx';
import { useLocation } from 'react-router';
import ErrorDisplay from '@components/shared/ErrorDisplay.tsx';
import { ErrorMessage, GoBackButton } from '@components/index.ts';

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
    <Box>
      {/* Display the Order Type & Order ID */}
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        {state?.orderNumber} - Order Information
      </Typography>
      
      <GoBackButton/>
      
      {/* Render the SalesOrderDetailsSection */}
      <SalesOrderDetailsSection orderId={orderId} />
    </Box>
  );
};

export default OrderDetailsPage;
