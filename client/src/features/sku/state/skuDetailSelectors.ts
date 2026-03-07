import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { SkuImageVariant, SkuPricing } from '@features/sku/state/skuTypes';

/**
 * Root selector for the SKU detail slice.
 *
 * @returns The full state object for the SKU detail module.
 */
const selectSkuDetailState = (state: RootState) =>
  selectRuntime(state).skuDetail;

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
  (detailsState): string | null => detailsState.error?.message ?? null
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
 * @returns {SkuImageGroup[]}
 */
export const selectSkuImageGroups = createSelector(
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
 * Selector: The primary image group (isPrimary = true),
 * or the first group as fallback.
 *
 * @returns {SkuImageGroup | null}
 */
export const selectSkuPrimaryImageGroup = createSelector(
  selectSkuImageGroups,
  (groups) => groups.find((g) => g.isPrimary) ?? groups[0] ?? null
);

/**
 * Selector: Thumbnail image variants for the SKU.
 *
 * Returns the thumbnail variant (or main fallback) from each image group.
 *
 * @returns {SkuImageVariant[]}
 */
export const selectSkuThumbnailImages = createSelector(
  selectSkuImageGroups,
  (groups): SkuImageVariant[] =>
    groups
      .map((g) => g.variants.thumbnail ?? g.variants.main ?? null)
      .filter((v): v is SkuImageVariant => Boolean(v))
);

/**
 * Selector: Active pricing rows (those with valid status info).
 *
 * @returns {SkuPricing[]}
 */
export const selectActivePricing = createSelector(selectSkuPricing, (pricing) =>
  pricing.filter((p: SkuPricing) => p.status?.id)
);
