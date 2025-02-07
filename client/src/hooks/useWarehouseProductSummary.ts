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
  const [productSummaryPage, setProductSummaryPage] = useState<number>(initialPage);
  const [productSummaryLimit, setProductSummaryLimit] = useState<number>(initialLimit);
  
  // Redux state
  const productSummary = useAppSelector(selectWarehouseProductSummary);
  const productSummaryPagination = useAppSelector(selectWarehouseProductPagination);
  const productSummaryLoading = useAppSelector(selectWarehouseProductLoading);
  const productSummaryError = useAppSelector(selectWarehouseProductError);
  
  // Fetch data when warehouseId, page, or limit changes
  useEffect(() => {
    if (warehouseId) {
      dispatch(fetchWarehouseProductSummaryThunk({ warehouseId, productSummaryPage, productSummaryLimit }));
    }
  }, [dispatch, warehouseId, productSummaryPage, productSummaryLimit]);
  
  // Manual refresh function
  const refreshProductSummary = useMemo(() => () => {
    dispatch(fetchWarehouseProductSummaryThunk({ warehouseId, productSummaryPage, productSummaryLimit }));
  }, [dispatch, warehouseId, productSummaryPage, productSummaryLimit]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetWarehouseProductSummary());
    };
  }, [dispatch]);
  
  return useMemo(() => ({
    productSummary,
    productSummaryPagination,
    productSummaryLoading,
    productSummaryError,
    productSummaryPage,
    productSummaryLimit,
    setProductSummaryPage,
    setProductSummaryLimit,
    refreshProductSummary,
  }), [productSummary, productSummaryPagination, productSummaryLoading, productSummaryError, productSummaryPage, productSummaryLimit, refreshProductSummary]);
};

export default useWarehouseProductSummary;
