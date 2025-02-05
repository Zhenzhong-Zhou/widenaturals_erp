import { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import {
  fetchWarehouseProductSummaryThunk, resetWarehouseProductSummary,
  selectWarehouseProductError,
  selectWarehouseProductLoading,
  selectWarehouseProductPagination,
  selectWarehouseProductSummary,
} from '../features/warehouse-inventory';

const useWarehouseProductSummary = (warehouseId: string, initialPage: number = 1, initialLimit: number = 10) => {
  const dispatch = useAppDispatch();
  
  // Local pagination state
  const [page, setPage] = useState<number>(initialPage);
  const [limit, setLimit] = useState<number>(initialLimit);
  
  // Redux state
  const productSummary = useAppSelector(selectWarehouseProductSummary);
  const pagination = useAppSelector(selectWarehouseProductPagination);
  const loading = useAppSelector(selectWarehouseProductLoading);
  const error = useAppSelector(selectWarehouseProductError);
  
  // Fetch data when warehouseId, page, or limit changes
  useEffect(() => {
    if (warehouseId) {
      dispatch(fetchWarehouseProductSummaryThunk({ warehouseId, page, limit }));
    }
  }, [dispatch, warehouseId, page, limit]);
  
  // Manual refresh function
  const refresh = useMemo(() => () => {
    dispatch(fetchWarehouseProductSummaryThunk({ warehouseId, page, limit }));
  }, [dispatch, warehouseId, page, limit]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetWarehouseProductSummary());
    };
  }, [dispatch]);
  
  return useMemo(() => ({
    productSummary,
    pagination,
    loading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    refresh,
  }), [productSummary, pagination, loading, error, page, limit, refresh]);
};

export default useWarehouseProductSummary;
