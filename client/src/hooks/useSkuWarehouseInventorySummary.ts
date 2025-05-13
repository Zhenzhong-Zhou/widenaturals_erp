import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks.ts';
import {
  selectSkuSummaryData,
  selectSkuSummaryError,
  selectSkuSummaryLoading,
  selectSkuSummaryPagination,
  selectSkuSummaryTotalAvailableQuantity,
} from '@features/warehouseInventory/state';
import { fetchSkuInventorySummaryThunk } from '@features/warehouseInventory/state/warehouseInventoryThunks';

/**
 * Custom hook to manage SKU inventory summary state and trigger fetching logic.
 *
 */
const useSkuWarehouseInventorySummary = ({ autoFetch = true } = {}) => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectSkuSummaryData);
  const pagination = useAppSelector(selectSkuSummaryPagination);
  const loading = useAppSelector(selectSkuSummaryLoading);
  const error = useAppSelector(selectSkuSummaryError);
  const totalAvailableQuantity = useAppSelector(selectSkuSummaryTotalAvailableQuantity);
  
  const refresh = (opts?: { page?: number; limit?: number }) => {
    dispatch(
      fetchSkuInventorySummaryThunk({
        page: opts?.page ?? pagination?.page ?? 1,
        limit: opts?.limit ?? pagination?.limit ?? 20,
      })
    );
  };
  
  useEffect(() => {
    if (autoFetch && data.length === 0 && !loading) {
      refresh();
    }
  }, [autoFetch, data.length, loading]);
  
  return {
    data,
    pagination,
    loading,
    error,
    totalAvailableQuantity,
    refresh,
  };
};

export default useSkuWarehouseInventorySummary;
