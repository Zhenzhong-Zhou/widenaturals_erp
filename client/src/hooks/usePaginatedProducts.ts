import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPaginatedProductsThunk,
  selectPaginatedProductsData,
  selectPaginatedProductsPagination,
  selectPaginatedProductsLoading,
  selectPaginatedProductsError,
  selectPaginatedProductsTotalRecords,
  selectPaginatedProductsIsEmpty,
  resetPaginatedProducts,
} from '@features/product/state';
import type { FetchProductParams } from '@features/product/state';
import { normalizePagination } from '@utils/pagination/normalizePagination';

/**
 * React hook that provides access to paginated Product list state and actions.
 *
 * Exposes:
 * - Product list data
 * - Loading & error state
 * - Pagination metadata
 * - Total record count
 * - Empty state indicator
 * - Actions to fetch or reset product list
 *
 * This hook should be used by all product list pages and list-based components.
 */
const usePaginatedProducts = () => {
  const dispatch = useAppDispatch();

  // ---------------------------
  // Selectors
  // ---------------------------
  const data = useAppSelector(selectPaginatedProductsData);
  const pagination = useAppSelector(selectPaginatedProductsPagination);
  const loading = useAppSelector(selectPaginatedProductsLoading);
  const error = useAppSelector(selectPaginatedProductsError);
  const totalRecords = useAppSelector(selectPaginatedProductsTotalRecords);
  const isEmpty = useAppSelector(selectPaginatedProductsIsEmpty);

  // ---------------------------
  // Actions
  // ---------------------------
  /**
   * Fetch paginated products.
   * Accepts pagination, sorting, and filter parameters.
   */
  const fetchProducts = useCallback(
    (params: FetchProductParams) => {
      dispatch(fetchPaginatedProductsThunk(params));
    },
    [dispatch]
  );

  /**
   * Reset product state back to initial empty paginated state.
   */
  const resetProducts = useCallback(() => {
    dispatch(resetPaginatedProducts());
  }, [dispatch]);

  // ---------------------------
  // Derived memoized values
  // ---------------------------
  const pageInfo = useMemo(() => {
    const { page, limit } = normalizePagination(pagination);
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

    fetchProducts,
    resetProducts,
  };
};

export default usePaginatedProducts;
