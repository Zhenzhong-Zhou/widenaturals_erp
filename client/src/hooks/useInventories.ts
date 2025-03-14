import { useCallback, useEffect, useMemo } from 'react';
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
const useInventories = (
  page: number,
  limit: number,
  sortBy: string = 'created_at',
  sortOrder: string = 'ASC'
) => {
  const dispatch = useAppDispatch();

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
  return useMemo(
    () => ({
      inventories,
      pagination,
      loading,
      error,
      isFetching,
      refresh, // Function to refresh inventory data
    }),
    [inventories, pagination, loading, error, isFetching, refresh]
  );
};

export default useInventories;
