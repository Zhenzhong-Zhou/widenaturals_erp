import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { PricingTypesState } from './pricingTypeTypes';

/**
 * Base selector for the pricingTypes slices with type assertion.
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
 * Selects the pagination object.
 */
export const selectPagination = createSelector(
  selectPricingTypesState,
  (state) => state.pagination
);

/**
 * Selects the total number of records.
 */
export const selectTotalRecords = createSelector(
  selectPagination,
  (pagination) => pagination?.totalRecords ?? 0
);

/**
 * Selects the total number of pages.
 */
export const selectTotalPages = createSelector(
  selectPagination,
  (pagination) => pagination?.totalPages ?? 1
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
