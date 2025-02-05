import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchWarehouseInventories,
  selectWarehouseInventories, selectWarehouseInventoryError,
  selectWarehouseInventoryLoading,
  selectWarehouseInventoryPagination,
} from '../features/warehouse-inventory';

/**
 * Custom hook to manage warehouse inventories with pagination.
 */
const useWarehouseInventories = (initialPage: number = 1, initialLimit: number = 10) => {
  const dispatch = useAppDispatch();
  
  // Local state for pagination
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);
  
  // Redux state selectors
  const inventories = useAppSelector(selectWarehouseInventories);
  const pagination = useAppSelector(selectWarehouseInventoryPagination);
  const loading = useAppSelector(selectWarehouseInventoryLoading);
  const error = useAppSelector(selectWarehouseInventoryError);
  
  // Fetch warehouse inventories
  useEffect(() => {
    dispatch(fetchWarehouseInventories({ page, limit }));
  }, [dispatch, page, limit]);
  
  // Refresh function
  const refresh = useCallback(() => {
    dispatch(fetchWarehouseInventories({ page, limit }));
  }, [dispatch, page, limit]);
  
  return useMemo(() => ({
    inventories,
    pagination,
    loading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    refresh,
  }), [inventories, pagination, loading, error, page, limit, refresh]);
};

export default useWarehouseInventories;
