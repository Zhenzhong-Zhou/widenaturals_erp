import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type AllocationReviewRequest,
  fetchInventoryAllocationReviewThunk,
  selectReviewAllocationIds,
  selectReviewAllocations,
  selectReviewCreatedBy,
  selectReviewError,
  selectReviewHeader,
  selectReviewItems,
  selectReviewItemCount,
  selectReviewLastFetchedAt,
  selectReviewLoading,
  selectReviewMessage,
  resetInventoryAllocationReview,
  setReviewError,
} from '@features/inventoryAllocation/state';

const useInventoryAllocationReview = () => {
  const dispatch = useAppDispatch();

  const loading = useAppSelector(selectReviewLoading);
  const error = useAppSelector(selectReviewError);
  const message = useAppSelector(selectReviewMessage);
  const lastFetchedAt = useAppSelector(selectReviewLastFetchedAt);

  const header = useAppSelector(selectReviewHeader);
  const items = useAppSelector(selectReviewItems);
  const itemCount = useAppSelector(selectReviewItemCount);
  const createdBy = useAppSelector(selectReviewCreatedBy);
  const allocations = useAppSelector(selectReviewAllocations);
  const allocationIds = useAppSelector(selectReviewAllocationIds);

  /**
   * Fetch review with explicit input.
   */
  const fetchReview = useCallback(
    (orderId: string, request: AllocationReviewRequest) => {
      if (orderId && request?.allocationIds?.length > 0) {
        dispatch(
          fetchInventoryAllocationReviewThunk({ orderId, body: request })
        );
      } else {
        console.warn(
          'Missing orderId or allocationIds for inventory review fetch'
        );
      }
    },
    [dispatch]
  );

  const resetReview = useCallback(() => {
    dispatch(resetInventoryAllocationReview());
  }, [dispatch]);

  const updateReviewError = useCallback(
    (msg: string | null) => {
      dispatch(setReviewError(msg));
    },
    [dispatch]
  );

  return {
    // State
    loading,
    error,
    message,
    lastFetchedAt,

    // Data
    header,
    items,
    itemCount,
    createdBy,
    allocationIds,
    allocations,

    // Actions
    fetchReview, // usage: fetchReview(orderId, requestBody)
    resetReview,
    setReviewError: updateReviewError,
  };
};

export default useInventoryAllocationReview;
