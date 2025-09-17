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
import Loading from '@components/common/Loading';
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
import useInventoryAllocationConfirmation from '@hooks/useInventoryAllocationConfirmation';
import type { AllocationReviewItem } from '@features/inventoryAllocation/state';

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
  
  // === Hooks ===
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
  
  const {
    loading: isConfirming,
    error: confirmError,
    success: confirmSuccess,
    message: confirmMessage,
    confirm: confirmedAllocation,
    reset: resetConfirmation,
  } = useInventoryAllocationConfirmation();
  
  // === Early Bailouts ===
  if (!orderId) {
    return <ErrorMessage message="Missing order ID in URL." />;
  }
  if (reviewError) {
    return <ErrorMessage message={reviewMessage ?? 'Failed to load allocation review.'} />;
  }
  
  // === Fetch & Refresh Logic ===
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
  
  // === Success Handler ===
  useEffect(() => {
    if (confirmSuccess) {
      alert(confirmMessage);
      refresh();
      resetConfirmation();
    }
  }, [confirmSuccess, confirmMessage, refresh]);
  
  // === Memoized Values ===
  const titleOrderNumber = useMemo(() => getShortOrderNumber(allocationReviewHeader?.orderNumber ?? ''), [allocationReviewHeader]);
  
  const flattenedHeader = useMemo(() => {
    return allocationReviewHeader ? flattenAllocationOrderHeader(allocationReviewHeader) : null;
  }, [allocationReviewHeader]);
  
  const flattenedItems = useMemo(() => {
    return allocationReviewItems ? flattenInventoryAllocationReviewItems(allocationReviewItems) : [];
  }, [allocationReviewItems]);
  
  const confirmableStatusCodes = [
    'ORDER_ALLOCATED',
    'ALLOC_CONFIRMED',
    'ALLOC_FULFILLING',
  ];
  
  const shouldHideConfirmButton = useMemo(() => {
    if (!allocationReviewItems || allocationReviewItems.length === 0) return false;
    
    return allocationReviewItems.some(
      (item: AllocationReviewItem) =>
        confirmableStatusCodes.includes(item.allocationStatusCode) ||
        confirmableStatusCodes.includes(item.orderItem?.statusCode ?? '')
    );
  }, [allocationReviewItems]);
  
  // === Confirm Submit ===
  const handleConfirmationSubmit = async () => {
    try {
      resetConfirmation();
      await confirmedAllocation(orderId); // Safe now
    } catch (error) {
      console.error('Confirmation error:', error);
    }
  };
  
  // === Loading State ===
  if (
    isReviewLoading ||
    isConfirming ||
    !allocationReviewHeader ||
    !allocationReviewItems?.length ||
    !flattenedHeader ||
    !flattenedItems?.length
  ) {
    return <Loading message="Loading allocation review..." />;
  }
  
  // === Render actual content (omitted) ===
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
              {confirmError && (
                <ErrorMessage message={confirmError} />
              )}
              {!shouldHideConfirmButton && (
                <CustomButton
                  onClick={handleConfirmationSubmit}
                  disabled={isReviewLoading || isConfirming}
                >
                  {isReviewLoading || isConfirming ? 'Confirming' : 'Confirm Allocation'}
                </CustomButton>
              )}
              <CustomButton
                onClick={refresh}
                variant="outlined"
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
          
          <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
            <CustomButton
              variant="outlined"
              color="secondary"
              href="/inventory-allocations"
            >
              Back to Inventory Allocations
            </CustomButton>
            
            <CustomButton
              variant="contained"
              color="info"
              href={`/orders/${category ?? 'sales'}/details/${orderId}`}
            >
              Back to Order Details
            </CustomButton>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InventoryAllocationReviewPage;
