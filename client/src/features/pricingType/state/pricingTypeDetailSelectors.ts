import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the pricing type detail slice.
 * Extracts the entire `pricingTypeDetail` state from Redux.
 */
const selectPricingTypeDetailState = (state: RootState) =>
  selectRuntime(state).pricingTypeDetail;

/**
 * Selector: Returns the pricing type detail object (`PricingTypeDetailRecord | null`).
 */
export const selectPricingTypeDetailData = createSelector(
  [selectPricingTypeDetailState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the pricing type detail request is currently loading.
 */
export const selectPricingTypeDetailLoading = createSelector(
  [selectPricingTypeDetailState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the pricing type detail state, if any.
 */
export const selectPricingTypeDetailError = createSelector(
  [selectPricingTypeDetailState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selector: True only if not loading AND pricing type detail is explicitly `null`.
 * Useful for handling "no such pricing type" cases.
 */
export const selectPricingTypeDetailIsEmpty = createSelector(
  [selectPricingTypeDetailData, selectPricingTypeDetailLoading],
  (data, loading) => !loading && data === null
);
