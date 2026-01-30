import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type { BatchRegistryQueryParams } from '@features/batchRegistry';
import {
  selectPaginatedBatchRegistryData,
  selectPaginatedBatchRegistryPagination,
  selectPaginatedBatchRegistryLoading,
  selectPaginatedBatchRegistryError,
  selectPaginatedBatchRegistryIsEmpty,
  fetchPaginatedBatchRegistryThunk,
  resetPaginatedBatchRegistry
} from '@features/batchRegistry';
import { normalizePagination } from '@utils/pagination/normalizePagination';

/**
 * usePaginatedBatchRegistry
 *
 * Returns paginated batch registry data that is already flattened
 * and UI-ready. No additional transformation is required at the
 * hook or component level.
 *
 * Responsibilities:
 * - Exposes flattened batch registry records from Redux state
 * - Provides pagination, loading, and error state
 * - Encapsulates fetch/reset actions for the batch registry list
 *
 * Design notes:
 * - Data returned from this hook is presentation-ready
 * - Consumers MUST NOT re-flatten or re-map records
 */
const usePaginatedBatchRegistry = () => {
  const dispatch = useAppDispatch();
  
  // ---------------------------
  // Selectors (memoized via Reselect)
  // ---------------------------
  const data = useAppSelector(selectPaginatedBatchRegistryData);
  const pagination = useAppSelector(selectPaginatedBatchRegistryPagination);
  const loading = useAppSelector(selectPaginatedBatchRegistryLoading);
  const error = useAppSelector(selectPaginatedBatchRegistryError);
  const isEmpty = useAppSelector(selectPaginatedBatchRegistryIsEmpty);
  
  // ---------------------------
  // Actions
  // ---------------------------
  /**
   * Fetch paginated batch registry records using Redux thunk.
   *
   * Parameters may include pagination, sorting, and filtering.
   */
  const fetchBatchRegistry = useCallback(
    (params: BatchRegistryQueryParams) => {
      dispatch(fetchPaginatedBatchRegistryThunk(params));
    },
    [dispatch]
  );
  
  /**
   * Reset paginated batch registry state back to the initial empty form.
   *
   * Typically used when:
   * - leaving the batch registry page
   * - switching modules
   * - performing a full filter reset
   */
  const resetBatchRegistry = useCallback(() => {
    dispatch(resetPaginatedBatchRegistry());
  }, [dispatch]);
  
  // ---------------------------
  // Derived memoized values
  // ---------------------------
  const pageInfo = useMemo(
    () => normalizePagination(pagination),
    [pagination]
  );
  
  return {
    data,
    pagination,
    loading,
    error,
    isEmpty,
    
    pageInfo, // { page, limit }
    
    fetchBatchRegistry,
    resetBatchRegistry,
  };
};

export default usePaginatedBatchRegistry;
