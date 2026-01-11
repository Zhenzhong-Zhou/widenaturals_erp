import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchComplianceRecordsThunk,
  selectPaginatedComplianceRecordsData,
  selectPaginatedComplianceRecordsPagination,
  selectPaginatedComplianceRecordsLoading,
  selectPaginatedComplianceRecordsError,
  selectPaginatedComplianceRecordsTotalRecords,
  selectPaginatedComplianceRecordsIsEmpty,
  resetPaginatedComplianceRecords,
} from '@features/complianceRecord/state';
import type { GetPaginatedComplianceRecordsParams } from '@features/complianceRecord/state';

/**
 * React hook for accessing paginated compliance records state and actions.
 *
 * Provides:
 * - compliance records list data
 * - loading and error states
 * - pagination metadata
 * - actions to fetch and reset data
 *
 * Recommended for all compliance list pages and table-driven components.
 */
const usePaginatedComplianceRecords = () => {
  const dispatch = useAppDispatch();

  // ---------------------------
  // Selectors (memoized via Reselect)
  // ---------------------------
  const data = useAppSelector(selectPaginatedComplianceRecordsData);
  const pagination = useAppSelector(selectPaginatedComplianceRecordsPagination);
  const loading = useAppSelector(selectPaginatedComplianceRecordsLoading);
  const error = useAppSelector(selectPaginatedComplianceRecordsError);
  const totalRecords = useAppSelector(
    selectPaginatedComplianceRecordsTotalRecords
  );
  const isEmpty = useAppSelector(selectPaginatedComplianceRecordsIsEmpty);

  // ---------------------------
  // Actions
  // ---------------------------
  /**
   * Fetch paginated compliance records using Redux thunk.
   *
   * Parameters may include pagination, sorting, and filter criteria.
   */
  const fetchComplianceRecords = useCallback(
    (params: GetPaginatedComplianceRecordsParams) => {
      dispatch(fetchComplianceRecordsThunk(params));
    },
    [dispatch]
  );

  /**
   * Reset compliance records state back to the initial empty paginated form.
   */
  const resetComplianceRecords = useCallback(() => {
    dispatch(resetPaginatedComplianceRecords());
  }, [dispatch]);

  // ---------------------------
  // Derived memoized values
  // ---------------------------
  const pageInfo = useMemo(() => {
    if (!pagination) {
      return { totalPages: 0, totalRecords: 0 };
    }
    
    const { totalPages, totalRecords } = pagination;
    return { totalPages, totalRecords };
  }, [pagination]);

  return {
    data,
    pagination,
    loading,
    error,
    totalRecords,
    isEmpty,

    pageInfo, // { page, limit }

    fetchComplianceRecords,
    resetComplianceRecords,
  };
};

export default usePaginatedComplianceRecords;
