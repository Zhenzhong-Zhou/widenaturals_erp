import { useCallback, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import {
  CustomButton,
  CustomTypography,
  ErrorMessage,
  GoBackButton,
  Loading,
} from '@components/index';
import {
  AllocationActionToolbar,
  AllocationOrderHeaderSection,
  AllocationReviewTable,
} from '@features/inventoryAllocation/components/AllocationInventoryReviewDetails';
import { getShortOrderNumber } from '@features/order/utils';
import {
  useInventoryAllocationConfirmation,
  useInventoryAllocationReview,
} from '@hooks/index';

interface LocationState {
  warehouseIds?: string[];
  allocationIds?: string[];
  category?: string;
}

const InventoryAllocationReviewPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    warehouseIds = [],
    allocationIds = [],
    category,
  }: LocationState = location.state || {};

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
    return (
      <ErrorMessage
        message={reviewMessage ?? 'Failed to load allocation review.'}
      />
    );
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
      setAllocationReviewError('Missing allocation IDs for allocation review.');
      navigate(`/orders/${category ?? 'sales'}/details/${orderId}`, {
        replace: true,
      });
      return;
    }

    // Reset previous state
    resetAllocationReview();
    setAllocationReviewError(null);

    // Fetch allocation review
    refresh();

    return () => resetAllocationReview(); // optional cleanup
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
  const titleOrderNumber = useMemo(
    () => getShortOrderNumber(allocationReviewHeader?.orderNumber ?? ''),
    [allocationReviewHeader]
  );

  const confirmableStatusCodes = ['ALLOC_PENDING'];

  const canConfirm = useMemo(() => {
    if (!allocationReviewItems || allocationReviewItems.length === 0)
      return false;

    return allocationReviewItems.some((item) =>
      confirmableStatusCodes.includes(item.allocationStatusCode)
    );
  }, [allocationReviewItems]);
  
  const allocationSummary = useMemo(() => {
    if (!allocationReviewItems || allocationReviewItems.length === 0) {
      return {
        total: 0,
        confirmed: 0,
        incomplete: 0,
        isFullyAllocated: false,
      };
    }
    
    const confirmed = allocationReviewItems.filter(
      (item) => item.allocationStatusCode === 'ALLOC_CONFIRMED'
    ).length;
    
    const total = allocationReviewItems.length;
    
    return {
      total,
      confirmed,
      incomplete: total - confirmed,
      isFullyAllocated: confirmed === total,
    };
  }, [allocationReviewItems]);
  
  const canInitiateFulfillment = allocationSummary.isFullyAllocated;

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
  if (isReviewLoading || isConfirming) {
    return <Loading message="Loading allocation review..." />;
  }

  if (!allocationReviewHeader) {
    return <ErrorMessage message="Allocation review not found." />;
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
            
            <AllocationActionToolbar
              confirmError={confirmError}
              canConfirm={canConfirm}
              handleConfirmationSubmit={handleConfirmationSubmit}
              isReviewLoading={isReviewLoading}
              isConfirming={isConfirming}
              allocationSummary={allocationSummary}
              canInitiateFulfillment={canInitiateFulfillment}
              orderId={orderId}
              allocationIds={allocationIds}
              allocationReviewHeader={allocationReviewHeader}
              refresh={refresh}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Allocation Order Header Info */}
          <AllocationOrderHeaderSection flattened={allocationReviewHeader} />

          {/* Allocation Items */}
          <AllocationReviewTable
            items={allocationReviewItems}
            itemCount={allocationItemCount}
          />

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
