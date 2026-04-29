import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPaginatedInventoryAllocationsThunk,
  selectPaginatedInventoryAllocationData,
  selectPaginatedInventoryAllocationPagination,
  selectPaginatedInventoryAllocationLoading,
  selectPaginatedInventoryAllocationError,
  selectPaginatedInventoryAllocationTotalRecords,
  selectPaginatedInventoryAllocationIsEmpty,
} from '@features/inventoryAllocation/state';
import type { InventoryAllocationQueryParams } from '@features/inventoryAllocation';
import { normalizePagination } from '@utils/pagination/normalizePagination';
import {
  resetPaginatedInventoryAllocation
} from '@features/inventoryAllocation/state/paginatedInventoryAllocationSlice';

/**
 * Custom hook to access memoized paginated inventory allocation state and actions.
 * Automatically tracks data, loading, error, pagination, and empty state.
 */
const usePaginatedInventoryAllocations = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectPaginatedInventoryAllocationData);
  const pagination = useAppSelector(selectPaginatedInventoryAllocationPagination);
  const loading = useAppSelector(selectPaginatedInventoryAllocationLoading);
  const error = useAppSelector(selectPaginatedInventoryAllocationError);
  const totalRecords = useAppSelector(selectPaginatedInventoryAllocationTotalRecords);
  const isEmpty = useAppSelector(selectPaginatedInventoryAllocationIsEmpty);
  
  /**
   * Fetch paginated inventory allocation summaries.
   * Accepts pagination, sorting, and filter parameters.
   */
  const fetchAllocations = useCallback(
    (params: InventoryAllocationQueryParams) => {
      dispatch(fetchPaginatedInventoryAllocationsThunk(params));
    },
    [dispatch]
  );
  
  /**
   * Reset allocation list state back to initial empty paginated state.
   */
  const resetAllocations = useCallback(() => {
    dispatch(resetPaginatedInventoryAllocation());
  }, [dispatch]);
  
  const pageInfo = useMemo(() => {
    const { page, limit } = normalizePagination(pagination);
    return { page, limit };
  }, [pagination]);
  
  return {
    data,
    pagination,
    loading,
    error,
    totalRecords,
    isEmpty,
    pageInfo,
    fetchAllocations,
    resetAllocations,
  };
};

export default usePaginatedInventoryAllocations;
