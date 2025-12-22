import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPaginatedSkusThunk,
  selectPaginatedSkusData,
  selectPaginatedSkusPagination,
  selectPaginatedSkusLoading,
  selectPaginatedSkusError,
  selectPaginatedSkusTotalRecords,
  selectPaginatedSkusIsEmpty,
  resetPaginatedSkus,
} from '@features/sku/state';
import type {
  FetchSkusParams,
} from '@features/sku/state';

/**
 * React hook for accessing paginated SKU list state and actions.
 *
 * Provides:
 * - SKU list data
 * - loading and error states
 * - pagination metadata
 * - actions to fetch and reset data
 *
 * Recommended for all SKU list pages and components.
 */
const usePaginatedSkus = () => {
  const dispatch = useAppDispatch();

  // ---------------------------
  // Selectors (memoized via Reselect)
  // ---------------------------
  const data = useAppSelector(selectPaginatedSkusData);
  const pagination = useAppSelector(selectPaginatedSkusPagination);
  const loading = useAppSelector(selectPaginatedSkusLoading);
  const error = useAppSelector(selectPaginatedSkusError);
  const totalRecords = useAppSelector(selectPaginatedSkusTotalRecords);
  const isEmpty = useAppSelector(selectPaginatedSkusIsEmpty);

  // ---------------------------
  // Actions
  // ---------------------------
  /**
   * Fetch a paginated SKU list using Redux thunk.
   *
   * Parameters should include pagination, sorting, and filters.
   */
  const fetchSkus = useCallback(
    (params: FetchSkusParams) => {
      dispatch(fetchPaginatedSkusThunk(params));
    },
    [dispatch]
  );

  /**
   * Reset SKU state back to the initial empty paginated form.
   */
  const resetSkus = useCallback(() => {
    dispatch(resetPaginatedSkus());
  }, [dispatch]);

  // ---------------------------
  // Derived memoized values
  // ---------------------------
  const pageInfo = useMemo(() => {
    const { page, limit } = pagination;
    return { page, limit };
  }, [pagination]);

  return {
    data,
    pagination,
    loading,
    error,
    totalRecords,
    isEmpty,

    pageInfo, // { page, limit }

    fetchSkus,
    resetSkus,
  };
};

export default usePaginatedSkus;
