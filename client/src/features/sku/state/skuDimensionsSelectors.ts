import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { UpdateSkuDimensionsResponse } from '@features/sku/state/skuTypes';

/**
 * Base selector — retrieves the full `skuDimensions` slice.
 */
const selectSkuDimensionsState = (state: RootState) =>
  selectRuntime(state).skuDimensions;

/**
 * Selector: returns the full API response or null.
 */
export const selectSkuDimensionsData = createSelector(
  [selectSkuDimensionsState],
  (state) => state.data
);

/**
 * Selector: returns loading flag.
 */
export const selectSkuDimensionsLoading = createSelector(
  [selectSkuDimensionsState],
  (state) => state.loading
);

/**
 * Selector: returns error message.
 */
export const selectSkuDimensionsError = createSelector(
  [selectSkuDimensionsState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selector: derived boolean indicating successful update.
 */
export const selectSkuDimensionsSuccess = createSelector(
  [selectSkuDimensionsData],
  (data) => !!data
);

/**
 * Selector: returns updated SKU ID.
 */
export const selectUpdatedSkuDimensionsId = createSelector(
  [selectSkuDimensionsData],
  (data: UpdateSkuDimensionsResponse | null) => data?.data?.id ?? null
);
