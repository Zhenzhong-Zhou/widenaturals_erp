import { useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchAllocationEligibleOrderDetailsThunk,
  selectAllocatableItems,
  selectAllocationEligibleOrderDetails,
  selectAllocationEligibleOrderError,
  selectAllocationEligibleOrderLoading,
} from '@features/order';

/**
 * Hook to manage fetching and selecting allocation-eligible order details for inventory allocation.
 *
 * @param orderId - The ID of the allocation-eligible order
 */
const useAllocationEligibleOrderDetails = (orderId: string) => {
  const dispatch = useAppDispatch();
  const [refreshCounter, setRefreshCounter] = useState(0);

  const data = useAppSelector(selectAllocationEligibleOrderDetails);
  const allocatableItems = useAppSelector(selectAllocatableItems);
  const loading = useAppSelector(selectAllocationEligibleOrderLoading);
  const error = useAppSelector(selectAllocationEligibleOrderError);

  const memoizedData = useMemo(() => data, [data]);
  const memoizedAllocatableItems = useMemo(
    () => allocatableItems,
    [allocatableItems]
  );
  const memoizedLoading = useMemo(() => loading, [loading]);
  const memoizedError = useMemo(() => error, [error]);

  const fetchAllocationData = useCallback(() => {
    if (!orderId) return;
    dispatch(fetchAllocationEligibleOrderDetailsThunk(orderId));
  }, [dispatch, orderId]);

  const manualRefresh = useCallback(() => {
    setRefreshCounter((prev) => prev + 1);
    fetchAllocationData();
  }, [fetchAllocationData]);

  return {
    data: memoizedData,
    allocatableItems: memoizedAllocatableItems,
    loading: memoizedLoading,
    error: memoizedError,
    fetchAllocationData,
    manualRefresh,
    refreshCounter,
  };
};

export default useAllocationEligibleOrderDetails;
