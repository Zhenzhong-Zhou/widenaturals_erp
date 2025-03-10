import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  AdjustmentReportParams,
  fetchAdjustmentReportThunk,
  exportAdjustmentReportThunk,
  selectAdjustmentReport,
} from '../features/report';

/**
 * Custom hook to fetch and manage adjustment report data.
 */
const useAdjustmentReport = (
  initialParams?: Partial<AdjustmentReportParams>
) => {
  const dispatch = useAppDispatch();
  const reportState = useAppSelector(selectAdjustmentReport);

  // Memoize state values to avoid unnecessary recomputations
  const {
    data,
    loading,
    error,
    pagination,
    exportData,
    exportFormat = initialParams?.exportFormat ?? "csv",
    exportLoading,
    exportError,
  } = useMemo(() => reportState, [reportState]);

  /**
   * Fetch paginated report.
   */
  const fetchReport = useCallback(
    (params?: Partial<AdjustmentReportParams>) => {
      const formattedParams = {
        ...initialParams,
        ...(params || {}),
      };
      dispatch(fetchAdjustmentReportThunk(formattedParams));
    },
    [dispatch, initialParams]
  );

  /**
   * Export report (CSV, PDF, TXT).
   */
  const exportReport = useCallback(
    (params: Partial<AdjustmentReportParams>) => {
      const formattedParams = {
        ...params,
        page: undefined,
        limit: undefined,
        totalRecords: undefined,
        totalPages: undefined,
      };
      
      dispatch(exportAdjustmentReportThunk(formattedParams));
    },
    [dispatch]
  );

  // Auto-fetch report on mount
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return useMemo(
    () => ({
      data,
      loading,
      error,
      pagination,
      fetchReport,
      exportReport,
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
      fetchReport,
      exportReport,
      exportData,
      exportFormat,
      exportLoading,
      exportError,
    ]
  );
};

export default useAdjustmentReport;
