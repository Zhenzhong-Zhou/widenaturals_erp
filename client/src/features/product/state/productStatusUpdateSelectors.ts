import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { UpdateProductApiResponse } from '@features/product/state/productTypes';

/**
 * Base selector — retrieves the full `productStatusUpdate` slice.
 */
const selectProductStatusUpdateState = (state: RootState) =>
  selectRuntime(state).productStatusUpdate;

/**
 * Selector: returns the full API response or null.
 */
export const selectProductStatusUpdateData = createSelector(
  [selectProductStatusUpdateState],
  (state) => state.data
);

/**
 * Selector: returns the loading flag.
 */
export const selectProductStatusUpdateLoading = createSelector(
  [selectProductStatusUpdateState],
  (state) => state.loading
);

/**
 * Selector: returns the current error message (if any).
 */
export const selectProductStatusUpdateError = createSelector(
  [selectProductStatusUpdateState],
  (state) => state.error
);

/**
 * Selector: derived boolean indicating status update success.
 */
export const selectProductStatusUpdateSuccess = createSelector(
  [selectProductStatusUpdateData],
  (data) => !!data
);

/**
 * Selector: returns the updated product ID or null.
 */
export const selectUpdatedProductStatusId = createSelector(
  [selectProductStatusUpdateData],
  (data: UpdateProductApiResponse | null) => data?.data?.id ?? null
);
