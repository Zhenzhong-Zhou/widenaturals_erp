import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPaginatedBomsThunk,
  selectBomData,
  selectBomError,
  selectBomFilters,
  selectBomLoading,
  selectBomPagination,
  selectHasMoreBomPages,
  selectIsBomListEmpty,
  resetPaginatedBoms,
  setBomFilters,
  setBomPagination,
} from '@features/bom/state';
import type {
  FetchBomsParams,
  PaginatedBomStateWithFilters,
} from '@features/bom/state';

/**
 * React hook for interacting with the BOM module state.
 *
 * Provides typed selectors, thunk dispatchers, and action dispatchers
 * with memoized callbacks for performance and consistency.
 *
 * @example
 * const {
 *   data, pagination, loading, error,
 *   filters, hasMore, isEmpty,
 *   fetchBoms, resetFilters, updateFilters, updatePagination,
 * } = useBoms();
 *
 * useEffect(() => {
 *   fetchBoms({ page: 1, limit: 10 });
 * }, [fetchBoms]);
 */
const usePaginatedBoms = () => {
  const dispatch = useAppDispatch();

  // --- Selectors ---
  const data = useAppSelector(selectBomData);
  const pagination = useAppSelector(selectBomPagination);
  const filters = useAppSelector(selectBomFilters);
  const loading = useAppSelector(selectBomLoading);
  const error = useAppSelector(selectBomError);
  const hasMore = useAppSelector(selectHasMoreBomPages);
  const isEmpty = useAppSelector(selectIsBomListEmpty);

  const totalRecords = pagination?.totalRecords ?? 0;
  const hasData = data.length > 0;

  // --- Action Dispatchers (memoized) ---
  /**
   * Triggers the paginated BOM fetch thunk with optional parameters.
   */
  const fetchBoms = useCallback(
    (params?: FetchBomsParams) =>
      dispatch(fetchPaginatedBomsThunk(params ?? {})),
    [dispatch]
  );

  const resetFilters = useCallback(() => {
    dispatch(resetPaginatedBoms());
  }, [dispatch]);

  const updateFilters = useCallback(
    (newFilters: FetchBomsParams['filters']) => {
      dispatch(setBomFilters(newFilters));
    },
    [dispatch]
  );

  const updatePagination = useCallback(
    (
      newPagination: Partial<
        NonNullable<PaginatedBomStateWithFilters['pagination']>
      >
    ) => {
      dispatch(setBomPagination(newPagination));
    },
    [dispatch]
  );

  // --- Memoized return object ---
  return useMemo(
    () => ({
      // State
      data,
      pagination,
      filters,
      loading,
      error,
      hasMore,
      isEmpty,
      totalRecords,
      hasData,

      // Actions
      fetchBoms,
      resetFilters,
      updateFilters,
      updatePagination,
    }),
    [
      data,
      pagination,
      filters,
      loading,
      error,
      hasMore,
      isEmpty,
      totalRecords,
      hasData,
      fetchBoms,
      resetFilters,
      updateFilters,
      updatePagination,
    ]
  );
};

export default usePaginatedBoms;
