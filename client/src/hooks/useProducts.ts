import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import {
  selectError,
  selectLoading,
  selectPagination,
  selectProducts,
} from '../features/product/state/productSelectors';
import { fetchProducts } from '../features/product/state/productThunks';
import { UseProductsResult } from '../features/product';

const useProducts = <T>(): UseProductsResult<T> => {
  const dispatch = useAppDispatch();

  // Select data from Redux store
  const products = useAppSelector(selectProducts) as T[]; // Ensure products is an array
  const pagination = useAppSelector(selectPagination);
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);

  // Local pagination state
  const [paginationState, setPaginationState] = useState({
    page: 1,
    limit: 10,
    category: '',
    name: '',
  });

  // Fetch products whenever paginationState changes
  useEffect(() => {
    dispatch(fetchProducts(paginationState))
      .unwrap()
      .catch((err) => {
        console.error('Failed to fetch products:', err);
      });
  }, [dispatch, paginationState]);

  // Manual refetch function
  const fetchProductsByPage = async (options?: {
    page?: number;
    limit?: number;
    category?: string;
    name?: string;
  }) => {
    setPaginationState((prev) => ({ ...prev, ...options }));
  };

  return {
    products,
    pagination,
    loading,
    error,
    fetchProductsByPage,
  };
};

export default useProducts;
