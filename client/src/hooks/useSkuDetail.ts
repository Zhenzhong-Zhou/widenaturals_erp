import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectSkuDetail,
  selectSkuDetailLoading,
  selectSkuDetailError,
  selectSkuProductInfo,
  selectSkuImageGroups,
  selectSkuPrimaryImageGroup,
  selectSkuThumbnailImages,
  selectActivePricing,
  selectSkuComplianceRecords,
  getSkuDetailByIdThunk,
  resetSkuDetail,
} from '@features/sku/state';

/**
 * Hook: Provides fully typed selectors and dispatchable actions
 * for interacting with SKU detail state.
 *
 * Uses grouped image model (SkuImageGroup).
 */
const useSkuDetail = () => {
  const dispatch = useAppDispatch();

  /* ------------------------------------------------------------------ */
  /* Selectors                                                          */
  /* ------------------------------------------------------------------ */

  const sku = useAppSelector(selectSkuDetail);
  const loading = useAppSelector(selectSkuDetailLoading);
  const error = useAppSelector(selectSkuDetailError);

  const product = useAppSelector(selectSkuProductInfo);

  // New grouped image selectors
  const imageGroups = useAppSelector(selectSkuImageGroups);
  const primaryImageGroup = useAppSelector(selectSkuPrimaryImageGroup);
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
  const resetSkuDetailState = useCallback(() => {
    dispatch(resetSkuDetail());
  }, [dispatch]);

  /* ------------------------------------------------------------------ */
  /* Memoized Combined Object                                           */
  /* ------------------------------------------------------------------ */

  const combined = useMemo(
    () => ({
      sku,
      product,
      imageGroups,
      primaryImageGroup,
      thumbnails,
      activePricing,
      complianceRecords,
    }),
    [
      sku,
      product,
      imageGroups,
      primaryImageGroup,
      thumbnails,
      activePricing,
      complianceRecords,
    ]
  );

  /* ------------------------------------------------------------------ */
  /* Public API                                                         */
  /* ------------------------------------------------------------------ */

  return {
    // state
    ...combined,
    loading,
    error,

    // actions
    fetchSkuDetail,
    resetSkuDetailState,
  };
};

export default useSkuDetail;
