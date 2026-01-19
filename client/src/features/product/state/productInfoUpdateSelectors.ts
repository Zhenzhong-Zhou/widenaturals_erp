import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { UpdateProductApiResponse } from '@features/product/state/productTypes';

/**
 * Base selector — retrieves the full `productInfoUpdate` slice.
 */
const selectProductInfoUpdateState = (state: RootState) =>
  selectRuntime(state).productInfoUpdate;

/**
 * Selector: returns the full API response or null.
 */
export const selectProductInfoUpdateData = createSelector(
  [selectProductInfoUpdateState],
  (state) => state.data
);

/**
 * Selector: returns the loading state.
 */
export const selectProductInfoUpdateLoading = createSelector(
  [selectProductInfoUpdateState],
  (state) => state.loading
);

/**
 * Selector: returns the error message (if any).
 */
export const selectProductInfoUpdateError = createSelector(
  [selectProductInfoUpdateState],
  (state) => state.error
);

/**
 * Selector: derived boolean indicating the update succeeded.
 */
export const selectProductInfoUpdateSuccess = createSelector(
  [selectProductInfoUpdateData],
  (data) => !!data
);

/**
 * Selector: returns the updated product ID or null.
 */
export const selectUpdatedProductInfoId = createSelector(
  [selectProductInfoUpdateData],
  (data: UpdateProductApiResponse | null) => data?.data?.id ?? null
);
