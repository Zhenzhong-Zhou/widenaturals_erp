import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { SkuImage, SkuPricing } from '@features/sku/state/skuTypes';

/**
 * Root selector for the SKU detail slice.
 *
 * @returns The full state object for the SKU detail module.
 */
const selectSkuDetailState = (state: RootState) => state.skuDetail;

/**
 * Selector: Loading status for the SKU detail request.
 *
 * Memoized: Yes (inexpensive, but stable reference for UI consumers).
 *
 * @returns {boolean} Whether the SKU detail is currently loading.
 */
export const selectSkuDetailLoading = createSelector(
  [selectSkuDetailState],
  (detailsState) => detailsState.loading
);

/**
 * Selector: Error message associated with the last failed fetch.
 *
 * @returns {string | null} Error message if present; otherwise null.
 */
export const selectSkuDetailError = createSelector(
  [selectSkuDetailState],
  (detailsState) => detailsState.error
);

/**
 * Selector: Raw SKU detail data (maybe null before first load).
 *
 * @returns {SkuDetail | null}
 */
export const selectSkuDetail = createSelector(
  [selectSkuDetailState],
  (detailsState) => detailsState.data
);

/**
 * Memoized selector returning the entire detail object.
 * Useful for deeply memoized components that depend on
 * reference stability (e.g., rendering subcomponents).
 *
 * @returns {SkuDetail | null}
 */
export const selectMemoizedSkuDetail = createSelector(
  selectSkuDetail,
  (data) => data
);

/**
 * Selector: Product-level metadata inside the SKU detail payload.
 *
 * @returns {SkuProduct | null}
 */
export const selectSkuProductInfo = createSelector(
  selectSkuDetail,
  (data) => data?.product ?? null
);

/**
 * Selector: Full list of SKU images (main, thumbnail, zoom).
 *
 * @returns {SkuImage[]}
 */
export const selectSkuImages = createSelector(
  selectSkuDetail,
  (data) => data?.images ?? []
);

/**
 * Selector: Pricing records linked to this SKU.
 *
 * @returns {SkuPricing[]}
 */
export const selectSkuPricing = createSelector(
  selectSkuDetail,
  (data) => data?.pricing ?? []
);

/**
 * Selector: Compliance documents (NPN, FDA, COA, etc.)
 * associated with this SKU.
 *
 * @returns {SkuComplianceRecord[]}
 */
export const selectSkuComplianceRecords = createSelector(
  selectSkuDetail,
  (data) => data?.complianceRecords ?? []
);

/**
 * Selector: The primary display image (isPrimary = true), if any.
 *
 * @returns {SkuImage | null}
 */
export const selectSkuPrimaryImage = createSelector(
  selectSkuImages,
  (images) => images.find((img: SkuImage) => img.isPrimary) ?? null
);

/**
 * Selector: Thumbnail images for the SKU.
 *
 * @returns {SkuImage[]}
 */
export const selectSkuThumbnailImages = createSelector(
  selectSkuImages,
  (images) => images.filter((img: SkuImage) => img.type === 'thumbnail')
);

/**
 * Selector: Active pricing rows (those with valid status info).
 *
 * @returns {SkuPricing[]}
 */
export const selectActivePricing = createSelector(selectSkuPricing, (pricing) =>
  pricing.filter((p: SkuPricing) => p.status?.id)
);
