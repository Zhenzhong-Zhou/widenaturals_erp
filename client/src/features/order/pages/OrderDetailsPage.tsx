import { type FC, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomButton from '@components/common/CustomButton';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import CustomTypography from '@components/common/CustomTypography';
import ErrorDisplay from '@components/shared/ErrorDisplay';
import GoBackButton from '@components/common/GoBackButton';
import { useOrderDetails } from '@hooks/useOrderDetails';
import { flattenSalesOrderHeader } from '../utils/transformOrderHeader';
import OrderItemsTable from '@features/order/components/OrderItemsTable';
import { formatCurrency, formatLabel, formatPhoneNumber, formatToThreeDecimal, toUpperCase } from '@utils/textUtils.ts';
import { formatDate } from '@utils/dateTimeUtils';
import { formatOrderStatus, formatPaymentStatus } from '@utils/formatters';

const OrderDetailsPage: FC = () => {
  // Get the `orderType` and `orderId` from the URL
  const { category, orderId } = useParams<{
    category: string;
    orderId: string;
  }>();
  const location = useLocation();
  const state = location.state as { orderNumber?: string };
  
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
  
  console.log(header)
  console.log(data)
  
  useEffect(() => {
    fetchById({ category, orderId });
  }, [category, orderId]);
  
  if (loading) return <Loading />;
  if (error) return <ErrorDisplay message="Failed to load order details." />;
  if (!data) return null;
  
  const flattened = flattenSalesOrderHeader(header);
  
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
      <Card
        sx={{
          margin: 'auto',
          maxWidth: '1500px',
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
            
            {/*<Stack direction="row" spacing={2} alignItems="center">*/}
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
            {/*  <CustomButton onClick={refresh}>Refresh Data</CustomButton>*/}
            {/*</Stack>*/}
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Order Header Info */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <MemoizedDetailsSection
                fields={[
                  { label: 'Order Number', value: flattened.order_number },
                  { label: 'Order Type', value: flattened.order_type, format: formatLabel },
                  { label: 'Order Date', value: flattened.order_date, format: formatDate },
                  { label: 'Delivery Method', value: flattened.delivery_info?.method, format: formatLabel },
                ]}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <MemoizedDetailsSection
                fields={[
                  { label: 'Order Status', value: flattened.order_status, format: formatOrderStatus },
                  { label: 'Status Date', value: flattened.order_status_date, format: formatDate },
                  { label: 'Payment Method', value: flattened.payment_info.method, format: formatLabel },
                  { label: 'Payment Status', value: flattened.payment_info.status, format: formatPaymentStatus },
                ]}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <MemoizedDetailsSection
                fields={[
                  { label: 'Customer Name', value: flattened.customer_name, format: formatLabel },
                  { label: 'Customer Email', value: flattened.customer_email },
                  { label: 'Customer Phone', value: flattened.customer_phone, format: formatPhoneNumber },
                ]}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <MemoizedDetailsSection
                fields={[
                  { label: 'Discount', value: flattened.discount, format: formatLabel },
                  { label: 'Discount Label', value: flattened.discount_label },
                ]}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <MemoizedDetailsSection
                fields={[
                  { label: 'Created At', value: flattened.audit_info.created_at, format: formatDate },
                  { label: 'Created By', value: flattened.audit_info.created_by.name, format: formatLabel },
                ]}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <MemoizedDetailsSection
                fields={[
                  { label: 'Updated At', value: flattened.audit_info.updated_at, format: (val) => formatDate(val, 'America/Vancouver', '-') },
                  { label: 'Updated By', value: flattened.audit_info.updated_by.name, format: formatLabel },
                ]}
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <MemoizedDetailsSection
                fields={
                  flattened.order_metadata
                    ? [
                      {
                        label: 'Price Override Summary',
                        value: flattened.order_metadata?.price_override_summary,
                        format: (summary) => {
                          if (!summary) return '—';
                          
                          const {
                            generated_at,
                            has_override,
                            override_count,
                            overrides,
                          } = summary;
                          
                          return (
                            <Box>
                              <CustomTypography component="div">
                                Generated At: {generated_at ?? '—'}
                              </CustomTypography>
                              <CustomTypography component="div">
                                Has Override: {has_override ? 'Yes' : 'No'}
                              </CustomTypography>
                              <CustomTypography component="div">
                                Override Count: {override_count ?? 0}
                              </CustomTypography>
                              
                              {Array.isArray(overrides) && overrides.length > 0 ? (
                                <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                                  {overrides.map((item, i) => (
                                    <li key={item.sku_id ?? i}>
                                      <strong>SKU:</strong> {item.productDisplayName} ({item.sku}) —{' '}
                                      <strong>DB:</strong> ${item.db_price} →{' '}
                                      <strong>Submitted:</strong> ${item.submitted_price}
                                    </li>
                                  ))}
                                </Box>
                              ) : (
                                <Box
                                  sx={{
                                    mt: 1,
                                    fontStyle: 'italic',
                                    color: 'text.secondary',
                                  }}
                                >
                                  No specific override records.
                                </Box>
                              )}
                            </Box>
                          );
                        },
                      },
                      { label: 'Order Note', value: flattened.order_note || 'N/A' },
                    ]
                    : [
                      { label: 'Order Note', value: flattened.order_note || 'N/A' },
                    ]
                }
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <MemoizedDetailsSection
                fields={[
               
                ]}
              />
            </Grid>
          </Grid>
          
          {/*/!* Shipping Info *!/*/}
          <Divider sx={{ my: 4 }} />
          <CustomTypography variant="h6" sx={{ mb: 2 }}>
            Shipping Information
          </CustomTypography>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <MemoizedDetailsSection
                fields={[
                  { label: 'Receipt Name', value: flattened.shipping_info.shipping_fullname, format: formatLabel },
                  { label: 'Phone Number', value: flattened.shipping_info.shipping_phone, format: formatPhoneNumber },
                  { label: 'Email', value: flattened.shipping_info.shipping_email },
                  { label: 'Shipping Address', value: flattened.shipping_info.address },
                ]}
              />
            </Grid>
          </Grid>
          
          {/*/!* Shipping Info *!/*/}
          <Divider sx={{ my: 4 }} />
          <CustomTypography variant="h6" sx={{ mb: 2 }}>
            Billing Information
          </CustomTypography>
          
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
          
          {/*/!* Items *!/*/}
          <Divider sx={{ my: 4 }} />
          <OrderItemsTable items={items} />
          
          {/*/!* Tracking Section *!/*/}
          <Divider sx={{ my: 4 }} />
          <CustomTypography variant="h6" sx={{ mb: 2 }}>
            Tracking Information
          </CustomTypography>
          <MemoizedDetailsSection
            fields={[
            
            ]}
          />
          
          {/*/!* Totals *!/*/}
          <Divider sx={{ my: 4 }} />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <MemoizedDetailsSection
                fields={[
                  { label: 'Currency Code', value: flattened.payment_info.currency_code, format: toUpperCase },
                  { label: 'Exchange Rate', value: flattened.payment_info.exchange_rate, format: formatToThreeDecimal },
                  { label: 'Base Currency Amount', value: flattened.payment_info.base_currency_amount, format: formatCurrency },
                  { label: 'Shipping Fee', value: flattened.shipping_fee, format: formatCurrency },
                  { label: 'Discount Amount', value: flattened.discount_amount, format: formatCurrency },
                ]}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <MemoizedDetailsSection
                fields={[
                  { label: 'Tax Rate', value: flattened.tax_rate },
                  { label: 'Tax Amount', value: flattened.tax_amount, format: formatCurrency },
                  { label: 'Total Amount', value: flattened.total_amount, format: formatCurrency },
                ]}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default OrderDetailsPage;
