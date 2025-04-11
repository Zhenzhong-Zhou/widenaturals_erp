import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectProducts,
  selectProductsPagination,
  selectProductsLoading,
  selectProductsError,
  type UseProductsResult,
  fetchProductsThunk,
} from '@features/product';

const useProducts = <T>(): UseProductsResult<T> => {
  const dispatch = useAppDispatch();

  // Selectors with memoization
  const products = useAppSelector(selectProducts) as T[];
  const pagination = useAppSelector(selectProductsPagination);
  const loading = useAppSelector(selectProductsLoading);
  const error = useAppSelector(selectProductsError);

  // Local state to manage pagination and filters
  const [paginationState, setPaginationState] = useState({
    page: 1,
    limit: 10,
    category: '',
    name: '',
  });

  // Fetch products whenever paginationState changes
  useEffect(() => {
    dispatch(fetchProductsThunk(paginationState))
      .unwrap()
      .catch((err) => {
        console.error('Failed to fetch products:', err);
      });
  }, [dispatch, paginationState]);

  // Refetch function to update pagination state and re-trigger data fetch
  const fetchProductsByPage = useCallback(
    async (options?: {
      page?: number;
      limit?: number;
      category?: string;
      name?: string;
    }): Promise<void> => {
      setPaginationState((prev) => ({ ...prev, ...options }));
    },
    []
  );

  return {
    products,
    pagination,
    loading,
    error,
    fetchProductsByPage,
  };
};

export default useProducts;
