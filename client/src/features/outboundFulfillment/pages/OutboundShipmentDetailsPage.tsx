import { type FC, lazy, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import {
  CustomButton,
  CustomTypography,
  ErrorMessage,
  GoBackButton,
  Loading,
  NoDataFound,
  SkeletonExpandedRow,
} from '@components/index';
import {
  OutboundShipmentHeaderSection
} from '@features/outboundFulfillment/components/OutboundShipmentDetails';
import ConfirmFulfillmentButton from '@features/outboundFulfillment/components/ConfirmFulfillmentButton';
import CompleteManualFulfillmentButton from '@features/outboundFulfillment/components/CompleteManualFulfillmentButton';
import { useOutboundShipmentDetails } from '@hooks/index';
import { getShortOrderNumber } from '@features/order/utils';

const FulfillmentDetailsTable = lazy(
  () => import('../components/OutboundShipmentDetails/FulfillmentDetailsTable')
);

const OutboundShipmentDetailsPage: FC = () => {
  const { shipmentId } = useParams();
  const location = useLocation();
  const { orderNumber } = location.state || {};

  if (!shipmentId) {
    // handle error, redirect, show fallback
    return <div>Invalid shipment</div>;
  }

  const {
    loading: shipmentDetailsLoading,
    error: shipmentDetailsError,
    header: shipmentHeader,
    fulfillments: shipmentFulfillments,
    itemCount: fulfillmentsItemCount,
    fetchDetails: fetchShipmentDetails,
    reset: resetShipmentDetails,
  } = useOutboundShipmentDetails();

  // === Fetch & Refresh Logic ===
  const refresh = useCallback(() => {
    if (shipmentId && orderNumber) {
      fetchShipmentDetails(shipmentId);
    }
  }, [shipmentId, orderNumber, fetchShipmentDetails]);

  useEffect(() => {
    if (!shipmentId) return;

    refresh();

    return () => {
      resetShipmentDetails();
    };
  }, [shipmentId, refresh, resetShipmentDetails]);

  // === Memoized Values ===
  const titleOrderNumber = useMemo(
    () => getShortOrderNumber(orderNumber ?? ''),
    [orderNumber]
  );

  // === Determine Confirm Button Visibility ===
  const canConfirmFulfillment = useMemo(() => {
    if (!shipmentHeader || !shipmentFulfillments?.length) return false;
    
    const shipmentCode = shipmentHeader.statusCode ?? '';
    
    const fulfillmentCodes = shipmentFulfillments.map(
      (f) => f.fulfillmentStatusCode ?? ''
    );
    
    const ALLOWED = {
      order: ['ORDER_PROCESSING', 'ORDER_FULFILLED'], // optional if you add order status later
      fulfillment: [
        'FULFILLMENT_PENDING',
        'FULFILLMENT_PICKING',
        'FULFILLMENT_PARTIAL',
      ],
      shipment: ['SHIPMENT_PENDING'],
    };
    
    const allFulfillmentsValid = fulfillmentCodes.every((code) =>
      ALLOWED.fulfillment.includes(code)
    );

    // Shipment must be in confirmable state
    const shipmentValid = ALLOWED.shipment.includes(shipmentCode);
    
    return allFulfillmentsValid && shipmentValid;
  }, [shipmentHeader, shipmentFulfillments]);
  
  const canCompleteManualFulfillment = useMemo(() => {
    if (!shipmentHeader || !shipmentFulfillments?.length) return false;
    
    const isPickupLocation = Boolean(
      shipmentHeader.deliveryMethodIsPickup
    );
    
    if (!isPickupLocation) return false;
    
    const shipmentCode = shipmentHeader.statusCode ?? '';
    
    const fulfillmentCodes = shipmentFulfillments.map(
      (f) => f.fulfillmentStatusCode ?? ''
    );
    
    const ALLOWED = {
      deliveryMethods: ['In-Store Pickup', 'Personal Driver Delivery'],
      fulfillment: ['FULFILLMENT_PACKED', 'FULFILLMENT_PARTIAL'],
      shipment: ['SHIPMENT_READY', 'SHIPMENT_DISPATCHED'],
    };
    
    const allFulfillmentsConfirmed = fulfillmentCodes.every((code) =>
      ALLOWED.fulfillment.includes(code)
    );
    
    const shipmentValid = ALLOWED.shipment.includes(shipmentCode);
    
    return allFulfillmentsConfirmed && shipmentValid;
  }, [shipmentHeader, shipmentFulfillments]);
  
  
  // === Render ===
  if (!shipmentHeader) {
    return (
      <Loading
        variant="dotted"
        message="Loading shipment details..."
      />
    );
  }
  
  if (!shipmentHeader || !shipmentFulfillments) {
    return (
      <NoDataFound
        message="Shipment details not found."
        action={<CustomButton onClick={refresh}>Retry</CustomButton>}
      />
    );
  }

  if (shipmentDetailsLoading) {
    return <Loading message="Loading outbound shipment details..." />;
  }

  if (shipmentDetailsError) {
    return <ErrorMessage message={shipmentDetailsError} />;
  }

  if (!shipmentHeader) {
    return <ErrorMessage message="No shipment header available." />;
  }

  if (!shipmentFulfillments) {
    return <ErrorMessage message="No shipment fulfimment details available." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <CustomTypography variant="h4" sx={{ mb: 2 }}>
        {titleOrderNumber} - Order Information
      </CustomTypography>

      {/* Actions Row */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <GoBackButton />
      </Stack>

      {/* Order Details */}
      <Card
        sx={{
          maxWidth: 1800,
          mx: 'auto',
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
              Outbound Shipment Details Review
            </CustomTypography>

            <Stack direction="row" spacing={2} alignItems="center">
              {shipmentDetailsError && (
                <ErrorMessage message={shipmentDetailsError} />
              )}

              <CustomButton
                onClick={refresh}
                variant="outlined"
                disabled={shipmentDetailsLoading}
              >
                {shipmentDetailsLoading ? 'Refreshing' : 'Refresh Data'}
              </CustomButton>
              
              {canConfirmFulfillment && (
                <ConfirmFulfillmentButton
                  orderId={shipmentHeader.orderId}
                  refresh={refresh}
                />
              )}
              
              {canCompleteManualFulfillment && (
                <CompleteManualFulfillmentButton
                  shipmentId={shipmentId}
                  refresh={refresh}
                />
              )}
            </Stack>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Outbound Shipment Details Header Info */}
          <OutboundShipmentHeaderSection
            orderNumber={orderNumber}
            flattened={shipmentHeader}
          />

          {/* Fulfillment Items */}

          {shipmentDetailsLoading ? (
            <SkeletonExpandedRow
              showSummary
              fieldPairs={6}
              summaryHeight={120}
              spacing={2}
            />
          ) : (
            <FulfillmentDetailsTable
              data={shipmentFulfillments}
              itemCount={fulfillmentsItemCount}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default OutboundShipmentDetailsPage;
