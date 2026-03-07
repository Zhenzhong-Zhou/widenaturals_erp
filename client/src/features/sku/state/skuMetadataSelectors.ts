import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { UpdateSkuMetadataResponse } from '@features/sku/state/skuTypes';

/**
 * Base selector — retrieves the full `skuMetadata` slice.
 */
const selectSkuMetadataState = (state: RootState) =>
  selectRuntime(state).skuMetadata;

/**
 * Selector: returns the full API response or null.
 */
export const selectSkuMetadataData = createSelector(
  [selectSkuMetadataState],
  (state) => state.data
);

/**
 * Selector: returns loading flag.
 */
export const selectSkuMetadataLoading = createSelector(
  [selectSkuMetadataState],
  (state) => state.loading
);

/**
 * Selector: returns error message (if any).
 */
export const selectSkuMetadataError = createSelector(
  [selectSkuMetadataState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selector: derived boolean indicating successful update.
 */
export const selectSkuMetadataSuccess = createSelector(
  [selectSkuMetadataData],
  (data) => !!data
);

/**
 * Selector: returns updated SKU ID.
 */
export const selectUpdatedSkuMetadataId = createSelector(
  [selectSkuMetadataData],
  (data: UpdateSkuMetadataResponse | null) => data?.data?.id ?? null
);
