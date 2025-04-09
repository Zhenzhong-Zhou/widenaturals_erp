import { useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchProductDetailThunk,
  Product,
  selectProductDetail,
  selectProductDetailError,
  selectProductDetailLoading,
} from '@features/product';

interface UseProductDetailResult {
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  refetchProduct: () => void;
}

/**
 * Custom hook to fetch and manage product details by ID via Redux.
 *
 * @param {string} productId - The ID of the product to fetch.
 * @returns {UseProductDetailResult} - Product data, loading/error state, and a refetch function.
 */
const useProductDetail = (productId: string): UseProductDetailResult => {
  const dispatch = useAppDispatch();
  
  const product = useAppSelector(selectProductDetail);
  const isLoading = useAppSelector(selectProductDetailLoading);
  const error = useAppSelector(selectProductDetailError);
  
  // Trigger data fetching
  const fetchProduct = useCallback(() => {
    if (productId) {
      dispatch(fetchProductDetailThunk(productId));
    }
  }, [dispatch, productId]);
  
  // Fetch on mount or when productId changes
  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);
  
  // Optional: useMemo for derived values if needed
  const memoizedProduct = useMemo(() => product, [product]);
  
  return {
    product: memoizedProduct,
    isLoading,
    error,
    refetchProduct: fetchProduct,
  };
};

export default useProductDetail;
