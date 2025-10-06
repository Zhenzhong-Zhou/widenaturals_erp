import { type FC, lazy, useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useLocation } from 'react-router';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import CustomTypography from '@components/common/CustomTypography';
import GoBackButton from '@components/common/GoBackButton';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomButton from '@components/common/CustomButton';
import Loading from '@components/common/Loading';
import useOutboundShipmentDetails from '@hooks/useOutboundShipmentDetails';
import { getShortOrderNumber } from '@features/order/utils/orderUtils';
import {
  flattenFulfillments,
  flattenShipmentHeader,
} from '@features/outboundFulfillment/utils/flattenOutboundShipmenDetails';
import { OutboundShipmentHeaderSection } from '@features/outboundFulfillment/components/OutboundShipmentDetails';
import SkeletonExpandedRow from '@components/common/SkeletonExpandedRow';
import NoDataFound from '@components/common/NoDataFound';

const FulfillmentDetailsTable = lazy(() =>
  import('../components/OutboundShipmentDetails/index')
);

const OutboundShipmentDetailsPage: FC = () => {
  const { shipmentId } = useParams();
  const location = useLocation();
  const { orderNumber } = location.state || {};
  
  const {
    data: shipmentDetails,
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
  const titleOrderNumber = useMemo(() => getShortOrderNumber(orderNumber ?? ''), [orderNumber]);
  
  const flattenedHeader = useMemo(() => {
    return shipmentHeader ? flattenShipmentHeader(shipmentHeader) : null;
  }, [shipmentHeader]);
  
  const flattenedFulfillments = useMemo(() => {
    return shipmentFulfillments ? flattenFulfillments(shipmentFulfillments) : null;
  }, [shipmentFulfillments]);
  
  // === Render ===
  if (!shipmentDetails || shipmentDetails.length === 0) {
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
  
  if (!flattenedHeader) {
    return <ErrorMessage message="No shipment header available." />;
  }
  
  if (!flattenedFulfillments) {
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
            </Stack>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Outbound Shipment Details Header Info */}
          <OutboundShipmentHeaderSection orderNumber={orderNumber} flattened={flattenedHeader} />
          
          {/* Fulfillment Items */}
          
          {shipmentDetailsLoading ? (
            <SkeletonExpandedRow showSummary fieldPairs={6} summaryHeight={120} spacing={2} />
          ) : (
            <FulfillmentDetailsTable
              data={flattenedFulfillments}
              itemCount={fulfillmentsItemCount}
            />
          )}
          
        </CardContent>
      </Card>
    </Box>
  );
};

export default OutboundShipmentDetailsPage;