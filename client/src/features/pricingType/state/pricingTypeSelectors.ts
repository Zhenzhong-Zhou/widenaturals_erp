import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { PricingTypesState } from '@features/pricingType/state/pricingTypeSlice';

/**
 * Base selector for the pricingTypes slice with type assertion.
 */
const selectPricingTypesState = (state: RootState): PricingTypesState =>
  state.pricingTypes as PricingTypesState;

/**
 * Selects the array of pricing types.
 */
export const selectPricingTypes = createSelector(
  selectPricingTypesState,
  (state) => state.data
);

/**
 * Selects the total number of records available.
 */
export const selectTotalRecords = createSelector(
  selectPricingTypesState,
  (state) => state.totalRecords
);

/**
 * Selects the total number of pages.
 */
export const selectTotalPages = createSelector(
  selectPricingTypesState,
  (state) => state.totalPages
);

/**
 * Selects the loading state for pricing types.
 */
export const selectIsLoading = createSelector(
  selectPricingTypesState,
  (state) => state.isLoading
);

/**
 * Selects the error message (if any) from the pricing types state.
 */
export const selectError = createSelector(
  selectPricingTypesState,
  (state) => state.error
);
