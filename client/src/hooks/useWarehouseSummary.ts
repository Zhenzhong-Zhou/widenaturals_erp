import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectWarehouseSummaryData,
  selectWarehouseSummaryLoading,
  selectWarehouseSummaryError,
  selectWarehouseSummaryWarehouseInfo,
  selectWarehouseSummaryTotals,
  selectWarehouseSummaryByBatchType,
  selectWarehouseSummaryByStatus,
  fetchWarehouseSummaryThunk,
} from '@features/warehouseInventory/state';
import { resetWarehouseSummary } from '@features/warehouseInventory/state/warehouseSummarySlice';

/**
 * Custom hook to access memoized warehouse summary state and actions.
 * Provides aggregate totals, batch type breakdown, and status breakdown.
 */
const useWarehouseSummary = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectWarehouseSummaryData);
  const loading = useAppSelector(selectWarehouseSummaryLoading);
  const error = useAppSelector(selectWarehouseSummaryError);
  const warehouseInfo = useAppSelector(selectWarehouseSummaryWarehouseInfo);
  const totals = useAppSelector(selectWarehouseSummaryTotals);
  const byBatchType = useAppSelector(selectWarehouseSummaryByBatchType);
  const byStatus = useAppSelector(selectWarehouseSummaryByStatus);
  
  /**
   * Fetch the aggregate summary for a warehouse.
   * @param warehouseId - Target warehouse UUID.
   */
  const fetchSummary = useCallback(
    (warehouseId: string) => {
      dispatch(fetchWarehouseSummaryThunk(warehouseId));
    },
    [dispatch]
  );
  
  /**
   * Reset the summary state to initial.
   */
  const resetSummary = useCallback(() => {
    dispatch(resetWarehouseSummary());
  }, [dispatch]);
  
  return {
    data,
    loading,
    error,
    warehouseInfo,
    totals,
    byBatchType,
    byStatus,
    fetchSummary,
    resetSummary,
  };
};

export default useWarehouseSummary;
