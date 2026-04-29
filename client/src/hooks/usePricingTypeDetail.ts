import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectPricingTypeDetailData,
  selectPricingTypeDetailLoading,
  selectPricingTypeDetailError,
  selectPricingTypeDetailIsEmpty,
  fetchPricingTypeByIdThunk,
} from '@features/pricingType';
import { resetPricingTypeDetail } from '@features/pricingType/state/pricingTypeDetailSlice';

/**
 * Hook: Provides typed selectors and dispatchable actions
 * for interacting with pricing type detail state.
 *
 * Includes:
 * - Memoized read selectors (`useAppSelector`)
 * - Memoized dispatchable actions (`useCallback`)
 * - Structured return API for clean component integration
 */
const usePricingTypeDetail = () => {
  const dispatch = useAppDispatch();
  
  // ----------------------------
  // Selectors
  // ----------------------------
  
  const pricingType = useAppSelector(selectPricingTypeDetailData);
  const loading = useAppSelector(selectPricingTypeDetailLoading);
  const error = useAppSelector(selectPricingTypeDetailError);
  const isEmpty = useAppSelector(selectPricingTypeDetailIsEmpty);
  
  // ----------------------------
  // Actions
  // ----------------------------
  
  /**
   * Fetch pricing type detail by ID (dispatch thunk).
   */
  const fetchPricingTypeDetail = useCallback(
    (pricingTypeId: string) => {
      if (!pricingTypeId?.trim()) return;
      dispatch(fetchPricingTypeByIdThunk(pricingTypeId));
    },
    [dispatch]
  );
  
  /**
   * Reset pricing type detail slice state (useful on unmount).
   */
  const resetPricingTypeDetailState = useCallback(() => {
    dispatch(resetPricingTypeDetail());
  }, [dispatch]);
  
  // ----------------------------
  // Memoized combined result
  // ----------------------------
  
  const combined = useMemo(
    () => ({
      pricingType,
      isEmpty,
    }),
    [pricingType, isEmpty]
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
    fetchPricingTypeDetail,
    resetPricingTypeDetailState,
  };
};

export default usePricingTypeDetail;
