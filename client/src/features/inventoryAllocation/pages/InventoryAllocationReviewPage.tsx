import { useCallback, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CustomButton from '@components/common/CustomButton';
import ErrorMessage from '@components/common/ErrorMessage';
import CustomTypography from '@components/common/CustomTypography';
import GoBackButton from '@components/common/GoBackButton';
import {
  AllocationOrderHeaderSection,
  AllocationReviewTable,
} from '@features/inventoryAllocation/components/AllocationInventoryReviewDetails';
import { getShortOrderNumber } from '@features/order/utils/orderUtils';
import {
  flattenAllocationOrderHeader,
  flattenInventoryAllocationReviewItems,
} from '@features/inventoryAllocation/utils/flattenAllocationReviewData';
import useInventoryAllocationReview from '@hooks/useInventoryAllocationReview';

interface LocationState {
  warehouseIds?: string[];
  allocationIds?: string[];
  category?: string;
}

const InventoryAllocationReviewPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { warehouseIds = [], allocationIds = [], category }: LocationState = location.state || {};
  
  const {
    loading: isReviewLoading,
    error: reviewError,
    message: reviewMessage,
    header: allocationReviewHeader,
    items: allocationReviewItems,
    itemCount: allocationItemCount,
    fetchReview: fetchAllocationReview,
    resetReview: resetAllocationReview,
    setReviewError: setAllocationReviewError,
  } = useInventoryAllocationReview();
  
  // Early exit if no orderId
  useEffect(() => {
    if (!orderId) {
      setAllocationReviewError("Missing order ID in URL.");
    }
  }, [orderId]);
  
  const refresh = useCallback(() => {
    if (orderId && category) {
      fetchAllocationReview(orderId, { warehouseIds, allocationIds });
    }
  }, [orderId, category, warehouseIds, allocationIds]);
  
  useEffect(() => {
    if (!orderId) return;
    
    if (!allocationIds.length) {
      setAllocationReviewError("Missing allocation IDs for allocation review.");
      navigate(`/orders/${category ?? 'sales'}/details/${orderId}`, { replace: true });
      return;
    }
    
    // Reset previous state
    resetAllocationReview();
    setAllocationReviewError(null);
    
    // Fetch allocation review
    refresh();
    
    return () => resetAllocationReview();  // optional cleanup
  }, [orderId, allocationIds, refresh]);
  
  if (!allocationReviewHeader) return null;
  if (!allocationReviewItems) return null;
  
  const titleOrderNumber = useMemo(() => getShortOrderNumber(allocationReviewHeader?.orderNumber ?? ''), [allocationReviewHeader]);
  
  const flattenedHeader = flattenAllocationOrderHeader(allocationReviewHeader);
  const flattenedItems = flattenInventoryAllocationReviewItems(allocationReviewItems);
  
  if (!orderId) {
    return <ErrorMessage message="Missing order ID in URL." />;
  }
  
  if (reviewError) {
    return <ErrorMessage message={reviewMessage ?? 'Failed to load allocation review.'} />;
  }
  
  if (isReviewLoading || !allocationReviewHeader || !allocationReviewItems) {
    return null; // Or add a loading spinner
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
              Inventory Allocation Review
            </CustomTypography>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <CustomButton
                onClick={refresh}
                disabled={isReviewLoading}
              >
                {isReviewLoading ? 'Refreshing' : 'Refresh Data'}
              </CustomButton>
            </Stack>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Allocation Order Header Info */}
          <AllocationOrderHeaderSection flattened={flattenedHeader} />
          
          {/* Allocation Items */}
          <AllocationReviewTable items={flattenedItems} itemCount={allocationItemCount} />
          
          <Box mt={4}>
            <CustomButton
              variant="outlined"
              href={`/orders/${category ?? 'sales'}/details/${orderId}`}
            >
              Back to Order
            </CustomButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InventoryAllocationReviewPage;
