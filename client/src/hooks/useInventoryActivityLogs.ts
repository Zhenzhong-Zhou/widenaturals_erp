import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type InventoryActivityLogParams,
  fetchInventoryActivityLogsThunk,
  exportInventoryActivityLogsThunk,
  selectInventoryActivityLogs,
} from '@features/report';

/**
 * Custom hook to fetch and manage inventory activity logs.
 */
const useInventoryActivityLogs = (
  initialParams?: Partial<InventoryActivityLogParams>
) => {
  const dispatch = useAppDispatch();
  const inventoryActivityLogState = useAppSelector(selectInventoryActivityLogs);

  // Memoize state values to prevent unnecessary recomputations
  const {
    inventoryLogs,
    isLoading,
    error,
    pagination,
    exportData,
    exportFormat,
    exportLoading,
    exportError,
  } = useMemo(() => inventoryActivityLogState, [inventoryActivityLogState]);

  /**
   * Fetch paginated inventory logs.
   */
  const fetchInventoryActivityLogs = useCallback(
    (params?: Partial<InventoryActivityLogParams>) => {
      const formattedParams = {
        ...initialParams,
        ...(params || {}),
      };
      dispatch(fetchInventoryActivityLogsThunk(formattedParams));
    },
    [dispatch, initialParams]
  );

  /**
   * Export inventory logs (CSV, PDF, TXT).
   */
  const exportLogs = useCallback(
    (params: Partial<InventoryActivityLogParams>) => {
      const formattedParams = {
        ...params,
        page: undefined,
        limit: undefined,
        totalRecords: undefined,
        totalPages: undefined,
      };
      dispatch(exportInventoryActivityLogsThunk(formattedParams));
    },
    [dispatch]
  );

  // Auto-fetch logs on mount
  useEffect(() => {
    fetchInventoryActivityLogs();
  }, [fetchInventoryActivityLogs]);

  return useMemo(
    () => ({
      inventoryLogs,
      isLoading,
      error,
      pagination,
      fetchInventoryActivityLogs,
      exportLogs,
      exportData,
      exportFormat,
      exportLoading,
      exportError,
    }),
    [
      inventoryLogs,
      isLoading,
      error,
      pagination,
      fetchInventoryActivityLogs,
      exportLogs,
      exportData,
      exportFormat,
      exportLoading,
      exportError,
    ]
  );
};

export default useInventoryActivityLogs;
