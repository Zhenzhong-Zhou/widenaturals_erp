import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type FetchPaginatedInventoryAllocationsParams,
  fetchPaginatedInventoryAllocationsThunk,
  selectInventoryAllocations,
  selectInventoryAllocationsError,
  selectInventoryAllocationsHasMore,
  selectInventoryAllocationsLimit,
  selectInventoryAllocationsLoading,
  selectInventoryAllocationsPage,
  selectInventoryAllocationsPagination,
  selectInventoryAllocationsTotalPages,
  selectInventoryAllocationsTotalRecords,
} from '@features/inventoryAllocation/state';
import { resetInventoryAllocationsState } from '@features/inventoryAllocation/state/paginatedInventoryAllocationsSlice';

/**
 * Custom hook to access and manage paginated inventory allocation data from the Redux store.
 *
 * Provides memoized selectors and a memoized reset dispatcher.
 *
 * Exposes:
 * - Selectors (data, pagination, loading, etc.)
 * - reset() → resets state
 * - fetch(params) → fetches paginated inventory allocation data
 */
export const usePaginatedInventoryAllocations = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectInventoryAllocations);
  const pagination = useAppSelector(selectInventoryAllocationsPagination);
  const loading = useAppSelector(selectInventoryAllocationsLoading);
  const error = useAppSelector(selectInventoryAllocationsError);
  const hasMore = useAppSelector(selectInventoryAllocationsHasMore);
  const page = useAppSelector(selectInventoryAllocationsPage);
  const limit = useAppSelector(selectInventoryAllocationsLimit);
  const totalRecords = useAppSelector(selectInventoryAllocationsTotalRecords);
  const totalPages = useAppSelector(selectInventoryAllocationsTotalPages);
  
  /**
   * Memoized reset action for clearing inventory allocation state.
   */
  const reset = useCallback(() => {
    dispatch(resetInventoryAllocationsState());
  }, [dispatch]);
  
  /**
   * Fetch inventory allocations with filters, pagination, etc.
   */
  const fetch = useCallback(
    (params: FetchPaginatedInventoryAllocationsParams = {}) => {
      return dispatch(fetchPaginatedInventoryAllocationsThunk(params));
    },
    [dispatch]
  );
  
  return useMemo(
    () => ({
      data,
      pagination,
      loading,
      error,
      hasMore,
      page,
      limit,
      totalRecords,
      totalPages,
      reset,
      fetch,
    }),
    [
      data,
      pagination,
      loading,
      error,
      hasMore,
      page,
      limit,
      totalRecords,
      totalPages,
      reset,
      fetch,
    ]
  );
};
