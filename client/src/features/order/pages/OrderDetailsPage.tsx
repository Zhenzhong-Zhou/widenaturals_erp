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
import OrderItemsTable from '@features/order/components/SalesOrderDetails/OrderItemsTable';
import OrderHeaderSection from '@features/order/components/SalesOrderDetails/OrderHeaderSection';
import CustomerInfoSection from '@features/order/components/SalesOrderDetails/CustomerInfoSection';
import DiscountInfoSection from '@features/order/components/SalesOrderDetails/DiscountInfoSection';
import PriceOverrideSection from '@features/order/components/SalesOrderDetails/PriceOverrideSection';
import OrderNoteSection from '@features/order/components/SalesOrderDetails/OrderNoteSection';
import ShippingInfoSection from '../components/SalesOrderDetails/ShippingInfoSection';
import BillingInfoSection from '@features/order/components/SalesOrderDetails/BillingInfoSection';
import CurrencyInfoSection from '@features/order/components/SalesOrderDetails/CurrencyInfoSection';
import AuditInfoSection from '@features/order/components/SalesOrderDetails/AuditInfoSection';
import OrderTotalsSection from '@features/order/components/SalesOrderDetails/OrderTotalsSection';
import { useOrderDetails } from '@hooks/useOrderDetails';
import { flattenSalesOrderHeader } from '@features/order/utils/transformOrderHeader';

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
  
  const {
    data,
    header,
    items,
    itemCount,
    loading,
    error,
    hasOrder,
    totals,
    fetchById,
    reset,
  } = useOrderDetails();
  
  const refresh = useCallback(() => {
    if (category && orderId) {
      fetchById({ category, orderId });
    }
  }, [category, orderId, fetchById]);
  
  useEffect(() => {
    reset();
    const timeout = setTimeout(refresh, 50);
    return () => clearTimeout(timeout);
  }, [refresh]);
  
  const titleOrderNumber = header?.orderNumber?.split('-').slice(0, 3).join('-');
  
  const noDataIcon = useMemo(() => <SearchOffIcon fontSize="large" color="disabled" />, []);
  const retryAction = useMemo(() => <CustomButton onClick={refresh}>Retry</CustomButton>, [refresh]);
  
  if (loading) return <Loading variant={'dotted'} message="Loading order details..." />;
  if (error) return <ErrorDisplay message="Failed to load order details." />;
  if (!hasOrder) {
    return (
      <NoDataFound
        message="No sales orders matched your filters."
        icon={noDataIcon}
        action={retryAction}
      />
    );
  }
  
  const flattened = flattenSalesOrderHeader(data);
  
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
            {/*  {canConfirm && (*/}
            {/*    <CustomButton*/}
            {/*      variant="contained"*/}
            {/*      color="primary"*/}
            {/*      onClick={() => confirm(orderId)}*/}
            {/*      disabled={confirmLoading}*/}
            {/*    >*/}
            {/*      {confirmLoading ? 'Confirming...' : 'Confirm Order'}*/}
            {/*    </CustomButton>*/}
            {/*  )}*/}
              <CustomButton onClick={refresh}>Refresh Data</CustomButton>
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
