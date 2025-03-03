import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchWarehouseInventoriesThunk,
  selectWarehouseInventories,
  selectWarehouseInventoryError,
  selectWarehouseInventoryLoading,
  selectWarehouseInventoryPagination,
} from '../features/warehouse-inventory';

/**
 * Custom hook to manage warehouse inventories with pagination.
 */
const useWarehouseInventories = (page: number, limit: number) => {
  const dispatch = useAppDispatch();

  const inventories = useAppSelector(selectWarehouseInventories);
  const pagination = useAppSelector(selectWarehouseInventoryPagination);
  const loading = useAppSelector(selectWarehouseInventoryLoading);
  const error = useAppSelector(selectWarehouseInventoryError);

  // Fetch warehouse inventories whenever `page` or `limit` changes
  useEffect(() => {
    dispatch(fetchWarehouseInventoriesThunk({ page, limit }));
  }, [dispatch, page, limit]); // Ensure it reacts to state changes

  // Refresh function
  const refresh = useCallback(() => {
    dispatch(fetchWarehouseInventoriesThunk({ page, limit }));
  }, [dispatch, page, limit]);

  return useMemo(
    () => ({
      inventories,
      pagination,
      loading,
      error,
      refresh,
    }),
    [inventories, pagination, loading, error, page, limit, refresh]
  );
};

export default useWarehouseInventories;
