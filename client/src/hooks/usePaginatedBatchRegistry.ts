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
 * React hook for accessing paginated batch registry state and actions.
 *
 * Provides:
 * - batch registry list data
 * - loading and error states
 * - pagination metadata
 * - actions to fetch and reset data
 *
 * Recommended for:
 * - batch registry pages
 * - batch registry tables
 * - inventory / compliance batch views
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
