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
  selectComplianceRecordById,
  resetPaginatedComplianceRecords,
} from '@features/complianceRecord/state';
import type {
  GetPaginatedComplianceRecordsParams,
  ComplianceRecordTableRow
} from '@features/complianceRecord/state';

/**
 * React hook for accessing paginated compliance records state and actions.
 *
 * Provides:
 * - compliance records list data
 * - loading and error states
 * - pagination metadata
 * - lookup helpers
 * - actions to fetch and reset data
 *
 * Recommended for all compliance list pages and table-driven components.
 */
const usePaginatedComplianceRecords = () => {
  const dispatch = useAppDispatch();
  
  // ---------------------------
  // Selectors
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
  // Lookup helpers
  // ---------------------------
  /**
   * Retrieve a compliance record by ID from the current page.
   *
   * Note:
   * - Scope is limited to the currently loaded page
   * - Returns undefined if the record is not present
   */
  const getById = useCallback(
    (id: string): ComplianceRecordTableRow | undefined =>
      useAppSelector(selectComplianceRecordById(id)),
    []
  );
  
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
  // Derived values
  // ---------------------------
  const pageInfo = useMemo(() => {
    if (!pagination) {
      return { totalPages: 0, totalRecords: 0 };
    }
    
    const { totalPages, totalRecords } = pagination;
    return { totalPages, totalRecords };
  }, [pagination]);
  
  return {
    // data
    data,
    loading,
    error,
    isEmpty,
    
    // pagination
    pagination,
    totalRecords,
    pageInfo,
    
    // lookup
    getById,
    
    // actions
    fetchComplianceRecords,
    resetComplianceRecords,
  };
};

export default usePaginatedComplianceRecords;
