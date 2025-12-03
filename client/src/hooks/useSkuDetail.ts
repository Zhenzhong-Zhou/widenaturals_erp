import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectSkuDetail,
  selectSkuDetailLoading,
  selectSkuDetailError,
  selectSkuProductInfo,
  selectSkuPrimaryImage,
  selectSkuImages,
  selectSkuThumbnailImages,
  selectActivePricing,
  selectSkuComplianceRecords,
} from '@features/sku/state';
import { getSkuDetailByIdThunk } from '@features/sku/state/skuThunks';
import { resetSkuDetailState } from '@features/sku/state/skuDetailSlice';

/**
 * Hook: Provides fully typed selectors and dispatchable actions
 * for interacting with SKU detail state.
 *
 * Includes:
 * - Memoized read selectors (`useAppSelector`)
 * - Memoized action dispatchers (`useCallback`)
 * - Structured return value for clean component integration
 */
const useSkuDetail = () => {
  const dispatch = useAppDispatch();

  // ----------------------------
  // Selectors (memoized by RTK selector + useAppSelector)
  // ----------------------------

  const sku = useAppSelector(selectSkuDetail);
  const loading = useAppSelector(selectSkuDetailLoading);
  const error = useAppSelector(selectSkuDetailError);

  const product = useAppSelector(selectSkuProductInfo);
  const images = useAppSelector(selectSkuImages);
  const primaryImage = useAppSelector(selectSkuPrimaryImage);
  const thumbnails = useAppSelector(selectSkuThumbnailImages);
  const activePricing = useAppSelector(selectActivePricing);
  const complianceRecords = useAppSelector(selectSkuComplianceRecords);

  // ----------------------------
  // Actions (always use useCallback)
  // ----------------------------

  /**
   * Fetch SKU detail by ID (dispatch thunk).
   */
  const fetchSkuDetail = useCallback(
    (skuId: string) => {
      if (!skuId?.trim()) return;
      dispatch(getSkuDetailByIdThunk(skuId));
    },
    [dispatch]
  );

  /**
   * Reset SKU detail slice state (on unmount or manual reset).
   */
  const resetSkuDetail = useCallback(() => {
    dispatch(resetSkuDetailState());
  }, [dispatch]);

  // ----------------------------
  // Optionally memoize combined values
  // ----------------------------

  const combined = useMemo(
    () => ({
      sku,
      product,
      images,
      primaryImage,
      thumbnails,
      activePricing,
      complianceRecords,
    }),
    [
      sku,
      product,
      images,
      primaryImage,
      thumbnails,
      activePricing,
      complianceRecords,
    ]
  );

  // ----------------------------
  // Final structured API
  // ----------------------------

  return {
    // state
    ...combined,
    loading,
    error,

    // actions
    fetchSkuDetail,
    resetSkuDetail,
  };
};

export default useSkuDetail;
