import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { UpdateSkuStatusResponse } from '@features/sku/state/skuTypes';

/**
 * Base selector — retrieves the full `skuStatus` slice.
 */
export const selectSkuStatusState = (state: RootState) => state.skuStatus;

/**
 * Selector: returns the full API response (`UpdateSkuStatusResponse`) or null.
 */
export const selectSkuStatusData = createSelector(
  [selectSkuStatusState],
  (state) => state.data
);

/**
 * Selector: returns the loading flag.
 */
export const selectSkuStatusLoading = createSelector(
  [selectSkuStatusState],
  (state) => state.loading
);

/**
 * Selector: returns the current error message (if any).
 */
export const selectSkuStatusError = createSelector(
  [selectSkuStatusState],
  (state) => state.error
);

/**
 * Selector: derived boolean indicating successful update.
 */
export const selectSkuStatusSuccess = createSelector(
  [selectSkuStatusData],
  (data) => !!data
);

/**
 * Selector: returns the updated SKU ID if status was successfully updated.
 *
 * Always returns:
 *   - string (SKU id)
 *   - or null if no update happened yet.
 */
export const selectUpdatedSkuId = createSelector(
  [selectSkuStatusData],
  (data: UpdateSkuStatusResponse | null) => data?.data?.id ?? null
);
