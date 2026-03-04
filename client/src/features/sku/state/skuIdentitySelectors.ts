import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { UpdateSkuIdentityResponse } from '@features/sku/state/skuTypes';

/**
 * Base selector — retrieves the full `skuIdentity` slice.
 */
const selectSkuIdentityState = (state: RootState) =>
  selectRuntime(state).skuIdentity;

/**
 * Selector: returns the full API response or null.
 */
export const selectSkuIdentityData = createSelector(
  [selectSkuIdentityState],
  (state) => state.data
);

/**
 * Selector: returns loading flag.
 */
export const selectSkuIdentityLoading = createSelector(
  [selectSkuIdentityState],
  (state) => state.loading
);

/**
 * Selector: returns error message.
 */
export const selectSkuIdentityError = createSelector(
  [selectSkuIdentityState],
  (state): string | null =>
    state.error?.message ?? null
);

/**
 * Selector: derived boolean indicating successful update.
 */
export const selectSkuIdentitySuccess = createSelector(
  [selectSkuIdentityData],
  (data) => !!data
);

/**
 * Selector: returns updated SKU ID.
 */
export const selectUpdatedSkuIdentityId = createSelector(
  [selectSkuIdentityData],
  (data: UpdateSkuIdentityResponse | null) => data?.data?.id ?? null
);
