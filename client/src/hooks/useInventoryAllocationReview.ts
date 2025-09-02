import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type AllocationReviewRequest,
  fetchInventoryAllocationReviewThunk,
  selectReviewAllocationIds,
  selectReviewCreatedBy,
  selectReviewError,
  selectReviewHeader,
  selectReviewItems,
  selectReviewLastFetchedAt,
  selectReviewLoading,
  selectReviewMessage,
  selectReviewProducts,
} from '@features/inventoryAllocation/state';
import {
  resetReviewState,
  setReviewError,
} from '@features/inventoryAllocation/state/inventoryAllocationReviewSlice';

const useInventoryAllocationReview = () => {
  const dispatch = useAppDispatch();
  
  const loading = useAppSelector(selectReviewLoading);
  const error = useAppSelector(selectReviewError);
  const message = useAppSelector(selectReviewMessage);
  const lastFetchedAt = useAppSelector(selectReviewLastFetchedAt);
  
  const header = useAppSelector(selectReviewHeader);
  const items = useAppSelector(selectReviewItems);
  const products = useAppSelector(selectReviewProducts);
  const createdBy = useAppSelector(selectReviewCreatedBy);
  const allocationIds = useAppSelector(selectReviewAllocationIds);
  
  /**
   * Fetch review with explicit input.
   */
  const fetchReview = useCallback(
    (orderId: string, request: AllocationReviewRequest) => {
      if (orderId && request?.allocationIds?.length > 0) {
        dispatch(fetchInventoryAllocationReviewThunk({ orderId, body: request }));
      } else {
        console.warn('Missing orderId or allocationIds for inventory review fetch');
      }
    },
    [dispatch]
  );
  
  const resetReview = useCallback(() => {
    dispatch(resetReviewState());
  }, [dispatch]);
  
  const updateReviewError = useCallback((msg: string | null) => {
    dispatch(setReviewError(msg));
  }, [dispatch]);
  
  const summary = useMemo(() => {
    return {
      productCount: products.length,
      totalAllocated: products.reduce((sum: number, p: { allocated: number }) => sum + p.allocated, 0),
    };
  }, [products]);
  
  return {
    // State
    loading,
    error,
    message,
    lastFetchedAt,
    
    // Data
    header,
    items,
    products,
    createdBy,
    allocationIds,
    summary,
    
    // Actions
    fetchReview, // usage: fetchReview(orderId, requestBody)
    resetReview,
    setReviewError: updateReviewError,
  };
};

export default useInventoryAllocationReview;
