import { type FC, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomButton from '@components/common/CustomButton';
import CustomTypography from '@components/common/CustomTypography';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import GoBackButton from '@components/common/GoBackButton';
import NoDataFound from '@components/common/NoDataFound';
import {
  AuditInfoSection,
  BillingInfoSection, CurrencyInfoSection,
  CustomerInfoSection,
  DiscountInfoSection,
  OrderHeaderSection, OrderItemsTable,
  OrderNoteSection, OrderTotalsSection,
  PriceOverrideSection,
  ShippingInfoSection,
} from '@features/order/components/SalesOrderDetails';
import usePermissions from '@hooks/usePermissions';
import useHasPermission from '@features/authorize/hooks/useHasPermission';
import { ORDER_CONSTANTS } from '@utils/constants/orderPermissions';
import { useOrderDetails } from '@hooks/useOrderDetails';
import { flattenSalesOrderHeader } from '@features/order/utils/transformOrderHeader';
import useUpdateOrderStatus from '@hooks/useUpdateOrderStatus';

const OrderDetailsPage: FC = () => {
  // Get the `orderType` and `orderId` from the URL
  const { category, orderId } = useParams<{
    category: string;
    orderId: string;
  }>();
  
  if (!category || !orderId) {
    return (
      <ErrorDisplay>
        <ErrorMessage
          message={'Invalid URL. Please check the link and try again.'}
        />
      </ErrorDisplay>
    );
  }
  
  const { loading, permissions } = usePermissions();
  const hasPermission = useHasPermission(permissions);
  
  const {
    data: orderData,
    header,
    items,
    itemCount,
    loading: orderLoading,
    error: orderError,
    hasOrder,
    totals,
    fetchById,
    reset: resetOrderDetails,
  } = useOrderDetails();
  
  const {
    data: updateStatusData,
    loading: updateStatusLoading,
    error: updateStatusError,
    isSuccess: isStatusUpdateSuccess,
    update: updateOrderStatus,
    reset: resetUpdateOrderStatus,
  } = useUpdateOrderStatus();
  
  const refresh = useCallback(() => {
    if (category && orderId) {
      fetchById({ category, orderId });
    }
  }, [category, orderId, fetchById]);
  
  useEffect(() => {
    resetOrderDetails();
    const timeout = setTimeout(refresh, 50);
    return () => clearTimeout(timeout);
  }, [refresh]);
  
  useEffect(() => {
    if (isStatusUpdateSuccess && updateStatusData) {
      alert(updateStatusData.message ?? 'Order status updated');
      resetUpdateOrderStatus(); // clean up local slice
      refresh(); // re-fetch order details
    }
  }, [isStatusUpdateSuccess, updateStatusData, resetUpdateOrderStatus, refresh]);
  
  useEffect(() => {
    if (updateStatusError) {
      alert(updateStatusError);
    }
  }, [updateStatusError]);
  
  const statusCode = header?.type?.code ?? '';
  
  const confirmableStatusCodes = [
    'ORDER_PENDING',
    'ORDER_EDITED',
    'ORDER_AWAITING_CONFIRMATION',
  ];
  
  const cancelableStatusCodes = [
    'ORDER_PENDING',
    'ORDER_EDITED',
    'ORDER_CONFIRMED',
  ];
  
  const canConfirmStatusUpdate = useMemo(() => {
    if (loading) return false;
    
    return (
      hasPermission(ORDER_CONSTANTS.PERMISSIONS.ACTIONS.CONFIRM_SALES_ORDER) &&
      confirmableStatusCodes.includes(statusCode)
    );
  }, [loading, hasPermission, statusCode]);
  
  const canCancelOrder = useMemo(() => {
    if (loading) return false;
    
    return (
      hasPermission(ORDER_CONSTANTS.PERMISSIONS.ACTIONS.CANCEL_SALES_ORDER) &&
      cancelableStatusCodes.includes(statusCode)
    );
  }, [loading, hasPermission, statusCode]);
  
  const handleStatusUpdate = async (statusCode: string) => {
    if (!orderId || !category) {
      console.warn('Missing orderId or category');
      return;
    }
    
    try {
      await updateOrderStatus({ category, orderId }, statusCode);
    } catch (err: any) {
      console.error('Unexpected error in handleStatusUpdate:', err);
    }
  };
  
  const titleOrderNumber = header?.orderNumber?.split('-').slice(0, 3).join('-');
  
  const noDataIcon = useMemo(() => <SearchOffIcon fontSize="large" color="disabled" />, []);
  const retryAction = useMemo(() => <CustomButton onClick={refresh}>Retry</CustomButton>, [refresh]);
  
  if (orderLoading) return <Loading variant={'dotted'} message="Loading order details..." />;
  if (orderError) return <ErrorDisplay message="Failed to load order details." />;
  if (!hasOrder) {
    return (
      <NoDataFound
        message="No sales orders matched your filters."
        icon={noDataIcon}
        action={retryAction}
      />
    );
  }
  
  const flattened = flattenSalesOrderHeader(orderData);
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <CustomTypography variant="h4" sx={{ marginBottom: 2 }}>
        {titleOrderNumber} - Order Information
      </CustomTypography>

      {/* Actions Row */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <GoBackButton />
      </Stack>

      {/* Order Details */}
      <Card
        sx={{
          margin: 'auto',
          maxWidth: '1800px',
          borderRadius: 3,
          boxShadow: 4,
          p: 3,
          mt: 4,
          backgroundColor: 'background.paper',
        }}
      >
        <CardContent>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <CustomTypography variant="h4" sx={{ fontWeight: 'bold' }}>
              Sales Order Details
            </CustomTypography>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <CustomButton
                onClick={refresh}
                disabled={orderLoading || updateStatusLoading}
              >
                {orderLoading ? 'Refreshing' : 'Refresh Data'}
              </CustomButton>
              {canConfirmStatusUpdate && (
                <CustomButton
                  variant="contained"
                  color="primary"
                  onClick={() => handleStatusUpdate('ORDER_CONFIRMED')}
                  disabled={updateStatusLoading || loading}
                >
                  {updateStatusLoading ? 'Confirming...' : 'Confirm Order'}
                </CustomButton>
              )}
              {canCancelOrder && (
                <CustomButton
                  variant="contained"
                  color="error"
                  onClick={() => handleStatusUpdate('ORDER_CANCELED')}
                  disabled={updateStatusLoading || loading}
                >
                  {updateStatusLoading ? 'Canceling...' : 'Cancel Order'}
                </CustomButton>
              )}
            </Stack>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Order Header Info */}
          <OrderHeaderSection flattened={flattened} />
          
          {/* Customer Info */}
          <CustomerInfoSection flattened={flattened} />
          
          {/* Discount Info */}
          <DiscountInfoSection flattened={flattened} />
          
          {/* Override Info */}
          <PriceOverrideSection flattened={flattened} />
          
          {/* Order Note */}
          <OrderNoteSection flattened={flattened} />
          
          {/* Shipping Info */}
          <ShippingInfoSection flattened={flattened} />
            
          {/* Billing Info */}
          <BillingInfoSection flattened={flattened} />
          
          {/* Order Items */}
          <OrderItemsTable items={items} itemCount={itemCount} />
          
          {/* Currency Info */}
          <CurrencyInfoSection flattened={flattened} />
          
          {/* Order Totals */}
          <OrderTotalsSection
            subtotal={Number(flattened.subtotal ?? 0)}
            discount={Number(flattened.discountAmount ?? 0)}
            taxRate={String(flattened.taxRate ?? '')}
            tax={Number(flattened.taxAmount ?? 0)}
            shipping={Number(totals.shippingFee ?? 0)}
            total={Number(totals.totalAmount ?? 0)}
            baseCurrencyAmount={Number(flattened.paymentInfo?.baseCurrencyAmount ?? 0)}
          />
          
          {/* Audit Info */}
          <AuditInfoSection flattened={flattened} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default OrderDetailsPage;
