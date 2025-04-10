import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectWarehouses,
  selectWarehousePagination,
  selectWarehouseLoading,
  selectWarehouseError,
  fetchWarehousesThunk,
} from '@features/warehouse';

// Custom Hook for Warehouses
const useWarehouses = ({
  page = 1,
  limit = 10,
  sortBy = 'storage_capacity',
  sortOrder = 'desc',
}) => {
  const dispatch = useAppDispatch();
  const warehouses = useAppSelector(selectWarehouses);
  const pagination = useAppSelector(selectWarehousePagination);
  const loading = useAppSelector(selectWarehouseLoading);
  const error = useAppSelector(selectWarehouseError);

  // Fetch function wrapped in useCallback for better stability
  const fetchData = useCallback(() => {
    dispatch(fetchWarehousesThunk({ page, limit, sortBy, sortOrder }));
  }, [dispatch, page, limit, sortBy, sortOrder]);

  // Fetch data only when necessary (e.g., first load or changes)
  useEffect(() => {
    if (!warehouses.length || pagination?.page !== page) {
      fetchData();
    }
  }, [fetchData, warehouses.length, pagination?.page]);

  // Memoized refetch function (manually refresh the data)
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Memoized return value to avoid unnecessary re-renders
  return useMemo(
    () => ({
      warehouses,
      pagination,
      loading,
      error,
      refetch, // Expose refetch function
    }),
    [warehouses, pagination, loading, error, refetch]
  );
};

export default useWarehouses;
