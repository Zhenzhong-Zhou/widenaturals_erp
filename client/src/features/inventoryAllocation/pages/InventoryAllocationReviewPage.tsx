import { useCallback, useEffect } from 'react';
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
  AllocationOrderHeaderSection, AllocationReviewTable,
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
  const { warehouseIds = [], allocationIds = [], category }: LocationState = location.state || {};
  const navigate = useNavigate();
  
  const {
    // State
    loading: isAllocationReviewLoading,
    error,
    message,
    lastFetchedAt,
    
    // Data
    header,
    items,
    itemCount,
    createdBy,
    allocationIds: stateAllocationIds, // ← avoid name clash
    allocations,
    
    // Actions
    fetchReview,
    resetReview,
    setReviewError,
  } = useInventoryAllocationReview();
  
  const refresh = useCallback(() => {
    if (category && orderId) {
      fetchReview(orderId, { warehouseIds, allocationIds });
    }
  }, [category, orderId, allocationIds]);
  
  useEffect(() => {
    if (!orderId) return;
    
    if (!allocationIds.length) {
      // Optionally show toast here
      setReviewError("Missing allocation IDs for allocation review.");
      
      // Redirect to order details page
      navigate(`/orders/${category ?? 'sales'}/details/${orderId}`, { replace: true });
      return;
    }
    
    // Reset previous state
    resetReview();
    setReviewError(null); // clear old error just in case
    
    // Fetch allocation review
    refresh();
    
    return () => {
      resetReview(); // optional cleanup
    };
  }, [orderId, allocationIds, refresh]);
  
  if (!header) return null;
  if (!items) return null;
  
  const titleOrderNumber = getShortOrderNumber(header?.orderNumber);
  
  const flattenedHeader = flattenAllocationOrderHeader(header);
  const flattenedItems = flattenInventoryAllocationReviewItems(items);
  
  if (!orderId) {
    return <ErrorMessage message="Missing order ID in URL." />;
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
              Inventory Allocation Review
            </CustomTypography>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <CustomButton
                onClick={refresh}
                disabled={isAllocationReviewLoading}
              >
                {isAllocationReviewLoading ? 'Refreshing' : 'Refresh Data'}
              </CustomButton>
            </Stack>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          {/* Allocation Order Header Info */}
          <AllocationOrderHeaderSection flattened={flattenedHeader} />
          
          {/* Allocation Items */}
          <AllocationReviewTable items={flattenedItems} itemCount={itemCount} />
          
          <Box mt={4}>
            <CustomButton variant="outlined" href={`/orders/${category}/details/${orderId}`}>
              Back to Order
            </CustomButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InventoryAllocationReviewPage;
