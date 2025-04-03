import { FC, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { SalesOrderDetailsSection } from '../index.ts';
import Box from '@mui/material/Box';
import Typography from '@components/common/Typography.tsx';
import { useLocation } from 'react-router';
import ErrorDisplay from '@components/shared/ErrorDisplay.tsx';
import { CustomButton, ErrorMessage, GoBackButton } from '@components/index.ts';
import { useConfirmSalesOrder } from '../../../hooks';
import { Snackbar, Stack } from '@mui/material';
import Alert from '@mui/material/Alert';

const OrderDetailsPage: FC = () => {
  // Get the `orderType` and `orderId` from the URL
  const { orderType, orderId } = useParams<{ orderType: string; orderId: string }>();
  const location = useLocation();
  const state = location.state as { orderNumber?: string };
  
  const { confirm, data, loading, error, successMessage } = useConfirmSalesOrder();
  
  // ref to call child refresh method
  const detailsRef = useRef<{ refresh: () => void }>(null);
  
  useEffect(() => {
    if (detailsRef.current) {
      detailsRef.current.refresh();
    }
  }, [data]);
  
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
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        {state?.orderNumber} - Order Information
      </Typography>
      
      {/* Actions Row */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <GoBackButton />
        <CustomButton
          variant="contained"
          color="primary"
          onClick={() => confirm(orderId)}
          disabled={loading}
        >
          {loading ? 'Confirming...' : 'Confirm Order'}
        </CustomButton>
      </Stack>
      
      {/* Order Details */}
      <SalesOrderDetailsSection ref={detailsRef} orderId={orderId} />
      
      {/* Error or success alert */}
      {!!error && (
        <ErrorMessage message={error}/>
      )}
      {!!successMessage && (
        <Snackbar open autoHideDuration={3000}>
          <Alert severity="success">{successMessage}</Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default OrderDetailsPage;
