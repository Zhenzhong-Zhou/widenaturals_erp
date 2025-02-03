import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  selectInventories,
  selectInventoryPagination,
  selectInventoryLoading,
  selectInventoryError,
  selectIsFetchingInventory,
  fetchAllInventories,
} from '../features/inventory';

/**
 * Custom hook for fetching and managing inventory data.
 */
const useInventories = (initialPage: number = 1, initialLimit: number = 10) => {
  const dispatch = useAppDispatch();
  
  // Local state for pagination
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<string>('ASC');
  
  // Redux state selectors
  const inventories = useAppSelector(selectInventories);
  const pagination = useAppSelector(selectInventoryPagination);
  const loading = useAppSelector(selectInventoryLoading);
  const error = useAppSelector(selectInventoryError);
  const isFetching = useAppSelector(selectIsFetchingInventory);
  
  /**
   * Fetch inventory data when dependencies change.
   */
  useEffect(() => {
    dispatch(fetchAllInventories({ page, limit, sortBy, sortOrder }));
  }, [dispatch, page, limit, sortBy, sortOrder]);
  
  /**
   * Refresh function to manually reload inventory data.
   */
  const refresh = useCallback(() => {
    dispatch(fetchAllInventories({ page, limit, sortBy, sortOrder }));
  }, [dispatch, page, limit, sortBy, sortOrder]);
  
  /**
   * Memoize return values for performance optimization.
   */
  return useMemo(() => ({
    inventories,
    pagination,
    loading,
    error,
    isFetching,
    page,
    limit,
    sortBy,
    sortOrder,
    setPage,
    setLimit,
    setSortBy,
    setSortOrder,
    refresh, // Function to refresh inventory data
  }), [inventories, pagination, loading, error, isFetching, page, limit, sortBy, sortOrder, refresh]);
};

export default useInventories;
