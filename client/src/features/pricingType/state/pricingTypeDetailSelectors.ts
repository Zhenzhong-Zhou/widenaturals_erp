import type { RootState } from '@store/store';
import { createSelector } from '@reduxjs/toolkit';
import type { PricingTypeState } from '@features/pricingType/state/pricingTypeDetailSlice';

/**
 * Base selector to access the pricingType slice from the Redux state.
 * Casts to PricingTypeState to avoid TS18046 "unknown" errors.
 */
const selectPricingTypeState = (state: RootState): PricingTypeState =>
  state.pricingType as PricingTypeState;

/**
 * Selects the detailed pricing type information.
 */
export const selectPricingTypeDetails = createSelector(
  selectPricingTypeState,
  (state) => state.pricingTypeDetails
);

/**
 * Selects the list of pricing records related to the pricing type.
 */
export const selectPricingRecords = createSelector(
  selectPricingTypeState,
  (state) => state.pricingDetails
);

/**
 * Selects pagination information for the pricing records.
 */
export const selectPricingPagination = createSelector(
  selectPricingTypeState,
  (state) => state.pagination
);

/**
 * Selects the loading state of the pricing type feature.
 */
export const selectPricingIsLoading = createSelector(
  selectPricingTypeState,
  (state) => state.isLoading
);

/**
 * Selects any error message related to pricing type operations.
 */
export const selectPricingError = createSelector(
  selectPricingTypeState,
  (state) => state.error
);
