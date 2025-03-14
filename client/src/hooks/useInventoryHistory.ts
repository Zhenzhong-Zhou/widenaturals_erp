import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  InventoryHistoryParams,
  selectInventoryHistory,
} from '../features/report';
import {
  exportInventoryHistoryThunk,
  fetchInventoryHistoryThunk,
} from '../features/report/state/reportThunks.ts';

/**
 * Custom hook for fetching and managing inventory history.
 */
const useInventoryHistory = (
  initialParams?: Partial<InventoryHistoryParams>
) => {
  const dispatch = useAppDispatch();

  // Select inventory history from Redux state
  const inventoryHistoryState = useAppSelector(selectInventoryHistory);

  // Memoized inventory state
  const {
    data,
    loading,
    error,
    pagination,
    exportData,
    exportFormat = initialParams?.exportFormat ?? 'csv',
    exportLoading,
    exportError,
  } = useMemo(() => inventoryHistoryState, [inventoryHistoryState]);

  // Fetch inventory history
  const fetchInventoryHistory = useCallback(
    (params?: Partial<InventoryHistoryParams>) => {
      const formattedParams = { ...initialParams, ...(params || {}) };
      dispatch(fetchInventoryHistoryThunk(formattedParams));
    },
    [dispatch, initialParams]
  );

  // Export inventory history
  const exportInventoryHistory = useCallback(
    (params: Partial<InventoryHistoryParams>) => {
      const formattedParams = {
        ...params,
        page: undefined,
        limit: undefined,
        totalRecords: undefined,
        totalPages: undefined,
      };

      dispatch(exportInventoryHistoryThunk(formattedParams));
    },
    [dispatch]
  );

  // Auto-fetch logs on mount
  useEffect(() => {
    fetchInventoryHistory();
  }, [fetchInventoryHistory]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      pagination,
      fetchInventoryHistory,
      exportInventoryHistory,
      exportData,
      exportFormat,
      exportLoading,
      exportError,
    }),
    [
      data,
      loading,
      error,
      pagination,
      fetchInventoryHistory,
      exportInventoryHistory,
      exportFormat,
      exportData,
      exportLoading,
      exportError,
    ]
  );
};

export default useInventoryHistory;
