import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  AdjustmentReportParams,
  fetchAdjustmentReportThunk,
  ReportPagination,
  selectAdjustmentReport,
} from '../features/report';
import { AdjustmentRecord } from '../features/report/state/reportTypes.ts';

/**
 * Custom hook to fetch and manage adjustment report data.
 *
 * @param {Object} initialParams - Default parameters for fetching the report.
 * @returns {{
 *   data: AdjustmentRecord[];
 *   loading: boolean;
 *   error: string | null;
 *   pagination: ReportPagination;
 *   fetchReport: (params?: Partial<AdjustmentReportParams>) => void;
 * }}
 */
const useAdjustmentReport = (initialParams?: Partial<AdjustmentReportParams>): {
    data: AdjustmentRecord[];
    loading: boolean;
    error: string | null;
    pagination: ReportPagination;
    fetchReport: (params?: Partial<AdjustmentReportParams>) => void;
} => {
  const dispatch = useAppDispatch();
  const { data, loading, error, pagination } = useAppSelector(selectAdjustmentReport);
  
  /**
   * Fetch report with given parameters (uses memoization for optimization).
   */
  const fetchReport = useCallback(
    (params?: Partial<AdjustmentReportParams>) => {
      dispatch(fetchAdjustmentReportThunk({ ...initialParams, ...params }));
    },
    [dispatch, initialParams]
  );
  
  // Fetch report on initial render
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);
  
  return { data, loading, error, pagination, fetchReport };
};

export default useAdjustmentReport;
