import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchWarehouseInventorySummaryThunk,
  selectWarehouseInventorySummary,
  selectWarehouseInventorySummaryError,
  selectWarehouseInventorySummaryLoading,
  selectWarehouseInventorySummaryPagination,
} from '../features/warehouse-inventory';

/**
 * Custom hook for managing warehouse inventory summary with backend pagination.
 */
const useWarehouseInventoriesSummary = (
  initialPage: number = 1,
  initialLimit: number = 3,
  initialStatus: string = ''
) => {
  const dispatch = useAppDispatch();

  // Local state for pagination & status filter
  const [summaryPage, setSummaryPage] = useState<number>(initialPage);
  const [summaryLimit, setSummaryLimit] = useState<number>(initialLimit);
  const [summaryStatus, setSummaryStatus] = useState<string>(initialStatus);

  // Redux state selectors
  const inventoriesSummary = useAppSelector(selectWarehouseInventorySummary);
  const summaryPagination = useAppSelector(
    selectWarehouseInventorySummaryPagination
  );
  const summaryLoading = useAppSelector(selectWarehouseInventorySummaryLoading);
  const summaryError = useAppSelector(selectWarehouseInventorySummaryError);

  // Fetch data when `page`, `limit`, or `status` changes
  useEffect(() => {
    dispatch(
      fetchWarehouseInventorySummaryThunk({
        summaryPage: summaryPage,
        summaryLimit: summaryLimit,
        summaryStatus: summaryStatus,
      })
    );
  }, [dispatch, summaryPage, summaryLimit, summaryStatus]);

  // Refresh function to reload data
  const refreshSummary = () => {
    dispatch(
      fetchWarehouseInventorySummaryThunk({
        summaryPage: summaryPage,
        summaryLimit: summaryLimit,
        summaryStatus: summaryStatus,
      })
    );
  };

  return {
    inventoriesSummary,
    summaryPagination,
    summaryLoading,
    summaryError,
    summaryPage,
    summaryLimit,
    summaryStatus,
    setSummaryPage,
    setSummaryLimit,
    setSummaryStatus,
    refreshSummary,
  };
};

export default useWarehouseInventoriesSummary;
