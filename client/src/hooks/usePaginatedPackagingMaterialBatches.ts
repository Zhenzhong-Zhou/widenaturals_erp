import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type { PackagingMaterialBatchQueryParams } from '@features/packagingMaterialBatch';
import {
  selectPaginatedPackagingMaterialBatchData,
  selectPaginatedPackagingMaterialBatchPagination,
  selectPaginatedPackagingMaterialBatchLoading,
  selectPaginatedPackagingMaterialBatchError,
  selectPaginatedPackagingMaterialBatchIsEmpty,
  fetchPaginatedPackagingMaterialBatchThunk,
  resetPaginatedPackagingMaterialBatches,
  makeSelectPackagingMaterialBatchById,
} from '@features/packagingMaterialBatch';
import { normalizePagination } from '@utils/pagination/normalizePagination';

/**
 * usePaginatedPackagingMaterialBatches
 *
 * Returns paginated packaging material batch data that is already
 * flattened and UI-ready. No additional transformation should occur
 * at the component level.
 *
 * Responsibilities:
 * - Exposes flattened packaging material batch records
 * - Provides pagination, loading, and error state
 * - Encapsulates fetch/reset actions
 *
 * Design notes:
 * - Data returned is presentation-ready
 * - Consumers MUST NOT re-map or re-flatten records
 */
export const usePaginatedPackagingMaterialBatches = () => {
  const dispatch = useAppDispatch();
  
  // ---------------------------
  // Selectors (memoized via Reselect)
  // ---------------------------
  const data = useAppSelector(
    selectPaginatedPackagingMaterialBatchData
  );
  
  const pagination = useAppSelector(
    selectPaginatedPackagingMaterialBatchPagination
  );
  
  const loading = useAppSelector(
    selectPaginatedPackagingMaterialBatchLoading
  );
  
  const error = useAppSelector(
    selectPaginatedPackagingMaterialBatchError
  );
  
  const isEmpty = useAppSelector(
    selectPaginatedPackagingMaterialBatchIsEmpty
  );
  
  // ---------------------------
  // Actions
  // ---------------------------
  /**
   * Fetch paginated packaging material batch records.
   *
   * Parameters may include pagination, sorting, and filtering.
   */
  const fetchPackagingMaterialBatches = useCallback(
    (params: PackagingMaterialBatchQueryParams) => {
      dispatch(fetchPaginatedPackagingMaterialBatchThunk(params));
    },
    [dispatch]
  );
  
  /**
   * Reset paginated packaging material batch state
   * back to its initial empty configuration.
   */
  const resetPackagingMaterialBatches = useCallback(() => {
    dispatch(resetPaginatedPackagingMaterialBatches());
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
    
    fetchPackagingMaterialBatches,
    resetPackagingMaterialBatches,
  };
};

/**
 * usePackagingMaterialBatchById
 *
 * Returns a single packaging material batch record by ID.
 *
 * Intended for:
 * - expanded table rows
 * - detail drawers
 * - side panels
 */
export const usePackagingMaterialBatchById = (id: string) => {
  const selector = useMemo(
    () => makeSelectPackagingMaterialBatchById(),
    []
  );
  
  return useAppSelector((state) => selector(state, id));
};
