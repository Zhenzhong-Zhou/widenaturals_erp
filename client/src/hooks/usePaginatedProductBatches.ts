import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type { ProductBatchQueryParams } from '@features/productBatch';
import {
  selectPaginatedProductBatchData,
  selectPaginatedProductBatchPagination,
  selectPaginatedProductBatchLoading,
  selectPaginatedProductBatchError,
  selectPaginatedProductBatchIsEmpty,
  fetchPaginatedProductBatchThunk,
  resetPaginatedProductBatches,
  makeSelectProductBatchById,
} from '@features/productBatch';
import { normalizePagination } from '@utils/pagination/normalizePagination';

/**
 * usePaginatedProductBatch
 *
 * Returns paginated product batch data that is already flattened
 * and UI-ready. No additional transformation is required at the
 * hook or component level.
 *
 * Responsibilities:
 * - Exposes flattened product batch records from Redux state
 * - Provides pagination, loading, and error state
 * - Encapsulates fetch/reset actions for the product batch list
 *
 * Design notes:
 * - Data returned from this hook is presentation-ready
 * - Consumers MUST NOT re-flatten or re-map records
 */
export const usePaginatedProductBatches = () => {
  const dispatch = useAppDispatch();

  // ---------------------------
  // Selectors (memoized via Reselect)
  // ---------------------------
  const data = useAppSelector(selectPaginatedProductBatchData);
  const pagination = useAppSelector(selectPaginatedProductBatchPagination);
  const loading = useAppSelector(selectPaginatedProductBatchLoading);
  const error = useAppSelector(selectPaginatedProductBatchError);
  const isEmpty = useAppSelector(selectPaginatedProductBatchIsEmpty);

  // ---------------------------
  // Actions
  // ---------------------------
  /**
   * Fetch paginated product batch records using Redux thunk.
   *
   * Parameters may include pagination, sorting, and filtering.
   */
  const fetchProductBatches = useCallback(
    (params: ProductBatchQueryParams) => {
      dispatch(fetchPaginatedProductBatchThunk(params));
    },
    [dispatch]
  );

  /**
   * Reset paginated product batch state back to the initial empty form.
   *
   * Typically used when:
   * - leaving the product batch page
   * - switching modules
   * - performing a full filter reset
   */
  const resetProductBatches = useCallback(() => {
    dispatch(resetPaginatedProductBatches());
  }, [dispatch]);

  // ---------------------------
  // Derived memoized values
  // ---------------------------
  const pageInfo = useMemo(() => normalizePagination(pagination), [pagination]);

  return {
    data,
    pagination,
    loading,
    error,
    isEmpty,

    pageInfo, // { page, limit }

    fetchProductBatches,
    resetProductBatches,
  };
};

/**
 * useProductBatchById
 *
 * Returns a single product batch record by ID.
 *
 * Intended for:
 * - expanded table rows
 * - detail drawers
 * - side panels
 */
export const useProductBatchById = (id: string) => {
  const selector = useMemo(() => makeSelectProductBatchById(), []);

  return useAppSelector((state) => selector(state, id));
};
