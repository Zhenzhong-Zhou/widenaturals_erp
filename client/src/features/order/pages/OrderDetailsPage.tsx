import {
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import {
  CustomButton,
  CustomTypography,
  ErrorDisplay,
  ErrorMessage,
  GoBackButton,
  Loading,
  NoDataFound,
} from '@components/index';
import {
  AuditInfoSection,
  BillingInfoSection,
  CurrencyInfoSection,
  CustomerInfoSection,
  DiscountInfoSection,
  OrderHeaderSection,
  OrderItemsTable,
  OrderNoteSection,
  OrderTotalsSection,
  PriceOverrideSection,
  ShippingInfoSection,
} from '@features/order/components/SalesOrderDetails';
import {
  AllocateInventoryDialog
} from '@features/inventoryAllocation/components/AllocateInventoryDialog';
import { useActionPermission } from '@features/authorize/hooks';
import { ORDER_CONSTANTS } from '@utils/constants/orderPermissions';
import { useOrderDetails } from '@hooks/useOrderDetails';
import {
  getShortOrderNumber,
} from '@features/order/utils';
import { useUpdateOrderStatus } from '@hooks/index';
import { useDialogFocusHandlers } from '@utils/hooks';

const OrderDetailsPage: FC = () => {
  // Get the `orderType` and `orderId` from the URL
  const { category, orderId } = useParams<{
    category: string;
    orderId: string;
  }>();

  if (!category || !orderId) {
    return (
      <ErrorMessage
        message={'Invalid URL. Please check the link and try again.'}
      />
    );
  }

  const isAllocatableCategory = category === 'allocatable';
  
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { handleOpenDialog, handleCloseDialog } = useDialogFocusHandlers(
    setDialogOpen,
    createButtonRef,
    () => dialogOpen
  );

  const {
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
  }, [
    isStatusUpdateSuccess,
    updateStatusData,
    resetUpdateOrderStatus,
    refresh,
  ]);

  useEffect(() => {
    if (updateStatusError) {
      alert(updateStatusError);
    }
  }, [updateStatusError]);

  const statusCode = header?.orderStatus?.code ?? '';

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

  const allocatableStatusCodes = ['ORDER_CONFIRMED'];
  
  const canConfirmStatusUpdate = useActionPermission(
    ORDER_CONSTANTS.PERMISSIONS.ACTIONS.CONFIRM_SALES_ORDER,
    statusCode,
    confirmableStatusCodes
  );
  
  const canCancelOrder = useActionPermission(
    ORDER_CONSTANTS.PERMISSIONS.ACTIONS.CANCEL_SALES_ORDER,
    statusCode,
    cancelableStatusCodes
  );
  
  const canAllocateOrder = useActionPermission(
    ORDER_CONSTANTS.PERMISSIONS.ACTIONS.ALLOCATE_ORDER,
    statusCode,
    allocatableStatusCodes
  );

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

  const titleOrderNumber = getShortOrderNumber(header?.orderNumber);

  const noDataIcon = useMemo(
    () => <SearchOffIcon fontSize="large" color="disabled" />,
    []
  );
  const retryAction = useMemo(
    () => <CustomButton onClick={refresh}>Retry</CustomButton>,
    [refresh]
  );

  if (orderLoading)
    return <Loading variant={'dotted'} message="Loading order details..." />;
  if (orderError)
    return <ErrorDisplay message="Failed to load order details." />;
  if (!hasOrder) {
    return (
      <NoDataFound
        message="No sales orders matched your filters."
        icon={noDataIcon}
        action={retryAction}
      />
    );
  }
  
  if (!header || !items) {
    return (
      <Loading
        variant="dotted"
        message="Loading sales order details..."
      />
    );
  }

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
              {!isAllocatableCategory && canConfirmStatusUpdate && (
                <CustomButton
                  variant="contained"
                  color="primary"
                  onClick={() => handleStatusUpdate('ORDER_CONFIRMED')}
                  disabled={updateStatusLoading}
                >
                  {updateStatusLoading ? 'Confirming...' : 'Confirm Order'}
                </CustomButton>
              )}
              {isAllocatableCategory && canAllocateOrder && (
                <CustomButton
                  variant="contained"
                  color="primary"
                  onClick={handleOpenDialog}
                  disabled={updateStatusLoading}
                >
                  {updateStatusLoading ? 'Allocating...' : 'Allocate Order'}
                </CustomButton>
              )}
              <AllocateInventoryDialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                orderId={orderId}
                category={category}
              />
              {!isAllocatableCategory && canCancelOrder && (
                <CustomButton
                  variant="contained"
                  color="error"
                  onClick={() => handleStatusUpdate('ORDER_CANCELED')}
                  disabled={updateStatusLoading}
                >
                  {updateStatusLoading ? 'Canceling...' : 'Cancel Order'}
                </CustomButton>
              )}
            </Stack>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Order Header Info */}
          <OrderHeaderSection flattened={header} />

          {/* Customer Info */}
          <CustomerInfoSection flattened={header} />

          {/* Discount Info */}
          <DiscountInfoSection flattened={header} />

          {/* Override Info */}
          <PriceOverrideSection flattened={header} />

          {/* Order Note */}
          <OrderNoteSection flattened={header} />

          {/* Shipping Info */}
          <ShippingInfoSection flattened={header} />

          {/* Billing Info */}
          <BillingInfoSection flattened={header} />

          {/* Order Items */}
          <OrderItemsTable items={items} itemCount={itemCount} />

          {/* Currency Info */}
          <CurrencyInfoSection flattened={header} />

          {/* Order Totals */}
          <OrderTotalsSection
            subtotal={Number(header.subtotal ?? 0)}
            discount={Number(header.discountAmount ?? 0)}
            taxRate={String(header.taxRate ?? '')}
            tax={Number(header.taxAmount ?? 0)}
            shipping={Number(totals.shippingFee ?? 0)}
            total={Number(totals.totalAmount ?? 0)}
            baseCurrencyAmount={Number(
              header.paymentInfo?.baseCurrencyAmount ?? 0
            )}
          />

          {/* Audit Info */}
          <AuditInfoSection flattened={header} />
        </CardContent>
      </Card>
    </Box>
  );
};

export default OrderDetailsPage;
