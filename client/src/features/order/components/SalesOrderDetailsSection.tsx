import { type FC, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import CustomTypography from '@components/common/CustomTypography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Loading from '@components/common/Loading';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomButton from '@components/common/CustomButton';
import MemoizedDetailsSection from '@components/common/DetailsSection';
import OrderItemsTable from '@features/order/components/OrderItemsTable';
import useSalesOrderDetails from '@hooks/useSalesOrderDetails';
import useConfirmSalesOrder from '@hooks/useConfirmSalesOrder';
import type { OrderDetailsData } from '@features/order/state';
import { formatDate } from '@utils/dateTimeUtils';
import {
  formatLabel,
  formatCurrency,
  formatShippingAddress,
} from '@utils/textUtils';

interface SalesOrderDetailsSectionProps {
  orderId: string;
}

const SalesOrderDetailsSection: FC<SalesOrderDetailsSectionProps> = ({
  orderId,
}) => {
  const {
    data: orderDetailsData,
    loading: orderDetailsLoading,
    error: orderError,
    refresh,
  } = useSalesOrderDetails(orderId);

  const {
    confirm,
    data: confirmData,
    loading: confirmLoading,
    error: confirmError,
    successMessage,
  } = useConfirmSalesOrder();

  useEffect(() => {
    if (confirmData?.data?.orderId && successMessage) {
      refresh(); // Trigger refresh after successful confirmation
    }
  }, [confirmData, successMessage]);

  const filteredOrderDetails = useMemo(() => {
    if (!orderDetailsData?.data) return null;

    const orderDetails: Partial<OrderDetailsData> = structuredClone(
      orderDetailsData.data
    );

    // Remove sensitive keys
    const sensitiveKeys: (keyof OrderDetailsData)[] = ['order_id'];
    sensitiveKeys.forEach((key) => delete orderDetails[key]);

    // Format label fields
    orderDetails.order_category = formatLabel(
      orderDetails.order_category ?? ''
    );
    orderDetails.customer_name = formatLabel(orderDetails.customer_name ?? '');

    // Format amounts (safely mutate)
    const currencyFields: (keyof OrderDetailsData)[] = [
      'discount_amount',
      'shipping_fee',
      'subtotal',
      'tax_amount',
      'total_amount',
    ];
    const mutable = orderDetails as Record<string, any>;
    currencyFields.forEach((key) => {
      const value = mutable[key];
      if (value && parseFloat(value) > 0) {
        mutable[key] = formatCurrency(value);
      } else {
        delete mutable[key];
      }
    });

    // Format date
    if (typeof orderDetails.order_date === 'string') {
      orderDetails.order_date = formatDate(orderDetails.order_date);
    }

    // Normalize delivery method
    if (orderDetails.delivery_info?.method) {
      orderDetails.delivery_info.method = formatLabel(
        orderDetails.delivery_info.method
      );
    }

    // Normalize empty metadata
    if (
      !orderDetails.order_metadata ||
      Object.keys(orderDetails.order_metadata).length === 0
    ) {
      orderDetails.order_metadata = { message: 'N/A' };
    }

    // Format items
    if (Array.isArray(orderDetails.items)) {
      orderDetails.items = orderDetails.items.map((item) => {
        const transformed = { ...item };
        delete (transformed as Record<string, any>).order_item_id;
        delete (transformed as Record<string, any>).product_id;

        if (transformed.system_price) {
          transformed.system_price = formatCurrency(transformed.system_price);
        }
        if (transformed.adjusted_price) {
          transformed.adjusted_price = formatCurrency(
            transformed.adjusted_price
          );
        }

        return transformed;
      });
    }

    return orderDetails;
  }, [orderDetailsData]);

  const canConfirm =
    filteredOrderDetails?.order_status &&
    ['pending', 'edited'].includes(
      filteredOrderDetails.order_status.toLowerCase()
    ) &&
    filteredOrderDetails.items?.every((item) =>
      ['pending', 'edited'].includes(
        (item as any)?.order_item_status_name?.toLowerCase() || ''
      )
    );

  if (orderDetailsLoading)
    return <Loading message="Loading Sales Order Details..." />;
  if (orderError || confirmError)
    return <ErrorMessage message={orderError || confirmError} />;
  if (!filteredOrderDetails)
    return <CustomTypography>No order details available.</CustomTypography>;

  return (
    <Card
      sx={{
        margin: 'auto',
        maxWidth: '1500px',
        borderRadius: 3,
        boxShadow: 4,
        padding: 3,
        marginTop: 4,
        backgroundColor: 'background.paper',
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 3,
          }}
        >
          <CustomTypography variant="h4" sx={{ fontWeight: 'bold' }}>
            Sales Order Details
          </CustomTypography>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            {canConfirm && (
              <CustomButton
                variant="contained"
                color="primary"
                onClick={() => confirm(orderId)}
                disabled={confirmLoading}
              >
                {confirmLoading ? 'Confirming...' : 'Confirm Order'}
              </CustomButton>
            )}
            <CustomButton onClick={refresh}>Refresh Data</CustomButton>
          </Stack>
        </Box>

        <Divider sx={{ marginBottom: 2 }} />

        <Grid container spacing={3}>
          <Grid size={6}>
            <MemoizedDetailsSection
              data={{
                'Order Number': filteredOrderDetails.order_number,
                'Order Category': filteredOrderDetails.order_category,
                'Delivery Method': filteredOrderDetails.delivery_info?.method,
                'Customer Name': filteredOrderDetails.customer_name,
                'Order Note': filteredOrderDetails.order_note || 'N/A',
              }}
            />
          </Grid>

          <Grid size={6}>
            <MemoizedDetailsSection
              data={{
                'Order Type': filteredOrderDetails.order_type,
                'Tracking Number':
                  filteredOrderDetails.delivery_info?.tracking_info,
                'Order Status': filteredOrderDetails.order_status,
                MetaData: filteredOrderDetails.order_metadata,
                'Order Date': filteredOrderDetails.order_date,
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ marginY: 2 }} />

        {filteredOrderDetails.shipping_info && (
          <Box mt={4}>
            <CustomTypography variant="h6" sx={{ marginBottom: 1 }}>
              Shipping Information
            </CustomTypography>
            <Grid container spacing={3}>
              <Grid size={6}>
                <MemoizedDetailsSection
                  data={{
                    'Recipient Name':
                      filteredOrderDetails.shipping_info?.shipping_fullname ||
                      'N/A',
                    Phone:
                      filteredOrderDetails.shipping_info?.shipping_phone ||
                      'N/A',
                    Email:
                      filteredOrderDetails.shipping_info?.shipping_email ||
                      'N/A',
                  }}
                />
              </Grid>

              <Grid size={6}>
                <MemoizedDetailsSection
                  data={formatShippingAddress(
                    filteredOrderDetails.shipping_info
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        <Divider sx={{ marginY: 2 }} />

        {filteredOrderDetails.items && (
          <OrderItemsTable items={filteredOrderDetails.items} />
        )}

        {/* Show tracking info if exists */}
        {filteredOrderDetails.delivery_info?.tracking_info && (
          <Box mt={2}>
            <CustomTypography variant="h6" sx={{ marginBottom: 1 }}>
              Tracking Information
            </CustomTypography>
            <MemoizedDetailsSection
              data={filteredOrderDetails.delivery_info.tracking_info}
            />
          </Box>
        )}

        <Divider sx={{ marginY: 2 }} />

        <Grid container spacing={3}>
          <Grid size={6}>
            <MemoizedDetailsSection
              data={{
                Discount: filteredOrderDetails.discount,
                'Discount Amount': filteredOrderDetails.discount_amount,
                'Shipping Fee': filteredOrderDetails.shipping_fee,
              }}
            />
          </Grid>

          <Grid size={6}>
            <MemoizedDetailsSection
              data={{
                Subtotal: filteredOrderDetails.subtotal,
                'Tax Rate': `${filteredOrderDetails.tax_rate}%`,
                'Tax Amount': filteredOrderDetails.tax_amount,
                'Total Amount': filteredOrderDetails.total_amount,
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SalesOrderDetailsSection;
