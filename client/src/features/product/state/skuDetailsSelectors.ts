import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { ImageInfo } from './skuTypes';

/**
 * Selects the entire SKU details slice from the root state.
 */
const selectSkuDetailsState = (state: RootState) => state.skuDetails;

/**
 * Selects the SKU data object from the slice.
 */
export const selectSkuDetails = createSelector(
  [selectSkuDetailsState],
  (state) => state.data
);

/**
 * Selects the loading state for SKU details fetch.
 */
export const selectSkuDetailsLoading = createSelector(
  [selectSkuDetailsState],
  (state) => state.loading
);

/**
 * Selects any error returned during SKU details fetch.
 */
export const selectSkuDetailsError = createSelector(
  [selectSkuDetailsState],
  (state) => state.error
);

/**
 * Selects all available images attached to the SKU.
 */
export const selectSkuImages = createSelector(
  [selectSkuDetails],
  (data) => data?.images || []
);

/**
 * Selects the primary image of type 'main' for the SKU, or null if not found.
 */
export const selectPrimaryMainImage = createSelector(
  [selectSkuDetails],
  (data): ImageInfo | null =>
    data?.images?.find(
      (img: ImageInfo) => img.type === 'main' && img.is_primary
    ) || null
);
