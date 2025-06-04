import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks.ts';
import { selectPrimaryMainImage, selectSkuDetails, selectSkuDetailsError, selectSkuDetailsLoading, selectSkuImages } from '@features/product/state/skuDetailsSelectors';
import { fetchSkuDetailsThunk } from '@features/product/state';

/**
 * Custom hook to fetch and consume SKU details from Redux state.
 *
 * Automatically fetches on mount if `autoFetch` is true.
 * Also returns image data, loading/error state, and a manual `refresh()` trigger.
 *
 * @param skuId - The SKU ID to fetch details for
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Object containing SKU detail data, loading state, error, images, and refresh method
 */
const useSkuDetails = (skuId: string, autoFetch = true) => {
  const dispatch = useAppDispatch();
  
  const skuDetails = useAppSelector(selectSkuDetails);
  const skuDetailsLoading = useAppSelector(selectSkuDetailsLoading);
  const skuDetailsError = useAppSelector(selectSkuDetailsError);
  const skuImages = useAppSelector(selectSkuImages);
  const primaryMainImage = useAppSelector(selectPrimaryMainImage);
  
  /**
   * Manually re-fetches SKU details by dispatching the async thunk.
   */
  const refresh = useCallback(() => {
    if (skuId) {
      dispatch(fetchSkuDetailsThunk(skuId));
    }
  }, [dispatch, skuId]);
  
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [autoFetch, refresh]);
  
  return {
    skuDetails,
    skuDetailsLoading,
    skuDetailsError,
    skuImages,
    primaryMainImage,
    refresh,
  };
};

export default useSkuDetails;
