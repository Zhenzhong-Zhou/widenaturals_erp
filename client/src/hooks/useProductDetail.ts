import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectProductDetailData,
  selectProductDetailLoading,
  selectProductDetailError,
  selectProductDetailIsEmpty,
  fetchProductDetailByIdThunk,
} from '@features/product/state';
import { resetProductDetailState } from '@features/product/state/productDetailSlice';

/**
 * Hook: Provides typed selectors and dispatchable actions
 * for interacting with Product Detail state.
 *
 * Includes:
 * - Memoized read selectors (`useAppSelector`)
 * - Memoized dispatchable actions (`useCallback`)
 * - Structured return API for clean component integration
 */
const useProductDetail = () => {
  const dispatch = useAppDispatch();
  
  // ----------------------------
  // Selectors
  // ----------------------------
  
  const product = useAppSelector(selectProductDetailData);
  const loading = useAppSelector(selectProductDetailLoading);
  const error = useAppSelector(selectProductDetailError);
  const isEmpty = useAppSelector(selectProductDetailIsEmpty);
  
  // ----------------------------
  // Actions
  // ----------------------------
  
  /**
   * Fetch Product detail by ID (dispatch thunk).
   */
  const fetchProductDetail = useCallback(
    (productId: string) => {
      if (!productId?.trim()) return;
      dispatch(fetchProductDetailByIdThunk(productId));
    },
    [dispatch]
  );
  
  /**
   * Reset Product detail slice state (useful on unmount).
   */
  const resetProductDetail = useCallback(() => {
    dispatch(resetProductDetailState());
  }, [dispatch]);
  
  // ----------------------------
  // Memoized combined result
  // ----------------------------
  
  const combined = useMemo(
    () => ({
      product,
      isEmpty,
    }),
    [product, isEmpty]
  );
  
  // ----------------------------
  // Hook Return API
  // ----------------------------
  
  return {
    // combined state
    ...combined,
    
    // simple state flags
    loading,
    error,
    
    // actions
    fetchProductDetail,
    resetProductDetail,
  };
};

export default useProductDetail;
