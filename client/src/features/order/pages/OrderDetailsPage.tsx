import { type FC, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomButton from '@components/common/CustomButton';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import CustomTypography from '@components/common/CustomTypography';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import GoBackButton from '@components/common/GoBackButton';
import DetailsGrid, { DetailsGridItem } from '@components/layout/DetailsGrid';
import Section from '@components/layout/Section';
import ConditionalSection from '@components/layout/ConditionalSection';
import { overrideSummaryFormatter } from '@features/order/utils/overrideSummaryFormatter';
import OrderSummarySection from '@features/order/components/OrderSummarySection';
import NoDataFound from '@components/common/NoDataFound';
import OrderItemsTable from '@features/order/components/OrderItemsTable';
import { useOrderDetails } from '@hooks/useOrderDetails';
import { flattenSalesOrderHeader } from '../utils/transformOrderHeader';
import { formatLabel, formatPhoneNumber, formatToThreeDecimal, toUpperCase } from '@utils/textUtils';
import { formatDate } from '@utils/dateTimeUtils';
import { formatOrderStatus, formatPaymentStatus } from '@utils/formatters';

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
        {header?.orderNumber} - Order Information
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
          <Section title={"Order Info"}>
            <DetailsGrid>
              <DetailsGridItem>
                <MemoizedDetailsSection
                  fields={[
                    { label: 'Order Number', value: flattened.order_number },
                    { label: 'Order Type', value: flattened.order_type, format: formatLabel },
                    { label: 'Order Date', value: flattened.order_date, format: formatDate },
                    { label: 'Delivery Method', value: flattened.delivery_info?.method, format: formatLabel },
                  ]}
                />
              </DetailsGridItem>
              
              <DetailsGridItem>
                <MemoizedDetailsSection
                  fields={[
                    { label: 'Order Status', value: flattened.order_status, format: formatOrderStatus },
                    { label: 'Status Date', value: flattened.order_status_date, format: formatDate },
                    { label: 'Payment Method', value: flattened.payment_info.method, format: formatLabel },
                    { label: 'Payment Status', value: flattened.payment_info.status, format: formatPaymentStatus },
                  ]}
                />
              </DetailsGridItem>
            </DetailsGrid>
          </Section>
          
          <Section title={"Customer Info"}>
            <DetailsGrid>
              <DetailsGridItem>
                <MemoizedDetailsSection
                  fields={[
                    { label: 'Customer Name', value: flattened.customer_name, format: formatLabel },
                    { label: 'Customer Email', value: flattened.customer_email },
                  ]}
                />
              </DetailsGridItem>
              <DetailsGridItem>
                <MemoizedDetailsSection
                  fields={[
                    { label: 'Customer Phone', value: flattened.customer_phone, format: formatPhoneNumber },
                  ]}
                />
              </DetailsGridItem>
            </DetailsGrid>
          </Section>
          
          {/* Discount Info */}
          <ConditionalSection title="Discount Info" condition={!!flattened.discount}>
            <DetailsGrid>
              <DetailsGridItem>
                <MemoizedDetailsSection
                  fields={[
                    { label: 'Discount', value: flattened.discount, format: formatLabel },
                    { label: 'Discount Label', value: flattened.discount_label },
                  ]}
                />
              </DetailsGridItem>
            </DetailsGrid>
          </ConditionalSection>
          
          {/* Override Info */}
          <ConditionalSection title="Override Info" condition={!!flattened.order_metadata?.price_override_summary}>
            <DetailsGrid>
              <DetailsGridItem fullWidth>
                <MemoizedDetailsSection
                  fields={[
                    {
                      label: 'Price Override Summary',
                      value: flattened.order_metadata?.price_override_summary ?? null,
                      format: overrideSummaryFormatter, // Extract formatter into reusable function if needed
                    },
                  ]}
                />
              </DetailsGridItem>
            </DetailsGrid>
          </ConditionalSection>
          
          {/* Order Note */}
          <ConditionalSection title="Order Note" condition={!!flattened.order_note}>
            <DetailsGrid>
              <DetailsGridItem fullWidth>
                <MemoizedDetailsSection
                  fields={[{ label: 'Note', value: flattened.order_note }]}
                />
              </DetailsGridItem>
            </DetailsGrid>
          </ConditionalSection>
          
          {/* Shipping Info */}
          <Section title="Shipping Info">
            <DetailsGrid>
              <DetailsGridItem fullWidth>
                <MemoizedDetailsSection
                  fields={[
                    { label: 'Receipt Name', value: flattened.shipping_info.shipping_fullname, format: formatLabel },
                    { label: 'Phone Number', value: flattened.shipping_info.shipping_phone, format: formatPhoneNumber },
                    { label: 'Email', value: flattened.shipping_info.shipping_email },
                    { label: 'Shipping Address', value: flattened.shipping_info.address },
                  ]}
                />
              </DetailsGridItem>
            </DetailsGrid>
          </Section>
            
          {/* Billing Info */}
          <Section title={"Billing Info"}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <MemoizedDetailsSection
                  fields={[
                    { label: 'Billing Name', value: flattened.billing_info.billing_fullname, format: formatLabel },
                    { label: 'Phone Number', value: flattened.billing_info.billing_phone, format: formatPhoneNumber },
                    { label: 'Email', value: flattened.billing_info.billing_email },
                    { label: 'Billing Address', value: flattened.billing_info.address },
                  ]}
                />
              </Grid>
            </Grid>
          </Section>
          
          {/* Order Items */}
          <OrderItemsTable items={items} itemCount={itemCount} />
          
          {/* Currency Info */}
          <Section title={"Currency Info"}>
            <DetailsGrid>
              <DetailsGridItem>
                <MemoizedDetailsSection
                  fields={[
                    { label: 'Currency Code', value: flattened.payment_info.currency_code, format: toUpperCase },
                    { label: 'Exchange Rate', value: flattened.payment_info.exchange_rate, format: formatToThreeDecimal },
                  ]}
                />
              </DetailsGridItem>
            </DetailsGrid>
          </Section>
          
          {/* Order Totals */}
          <Section title="Order Totals">
            <OrderSummarySection
              subtotal={Number(flattened.subtotal ?? 0)}
              discount={Number(flattened.discount_amount ?? 0)}
              taxRate={String(flattened.tax_rate ?? '')}
              tax={Number(flattened.tax_amount ?? 0)}
              shipping={Number(totals.shippingFee ?? 0)}
              total={Number(totals.totalAmount ?? 0)}
              baseCurrencyAmount={Number(flattened.payment_info?.base_currency_amount ?? 0)}
            />
          </Section>
          
          {/* Audit Info */}
          <Section title="Audit Info">
            <DetailsGrid>
              <DetailsGridItem>
                <MemoizedDetailsSection
                  fields={[
                    { label: 'Created At', value: flattened.audit_info.created_at, format: formatDate },
                    { label: 'Created By', value: flattened.audit_info.created_by.name, format: formatLabel },
                  ]}
                />
              </DetailsGridItem>
              <DetailsGridItem>
                <MemoizedDetailsSection
                  fields={[
                    { label: 'Updated At', value: flattened.audit_info.updated_at, format: (val) => formatDate(val, 'America/Vancouver', '-') },
                    { label: 'Updated By', value: flattened.audit_info.updated_by.name, format: formatLabel },
                  ]}
                />
              </DetailsGridItem>
            </DetailsGrid>
          </Section>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OrderDetailsPage;
