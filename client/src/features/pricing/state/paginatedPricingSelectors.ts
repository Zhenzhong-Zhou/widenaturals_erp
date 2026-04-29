import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the paginated Pricing slice.
 * Extracts the entire `paginatedPricing` state from the Redux store.
 */
const selectPaginatedPricingState = (state: RootState) =>
  selectRuntime(state).paginatedPricing;

/**
 * Selector: Returns the array of flattened pricing join records.
 * Memoized using `createSelector`.
 */
export const selectPaginatedPricingData = createSelector(
  [selectPaginatedPricingState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the pricing list request is currently loading.
 */
export const selectPaginatedPricingLoading = createSelector(
  [selectPaginatedPricingState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the pricing list state, if any.
 */
export const selectPaginatedPricingError = createSelector(
  [selectPaginatedPricingState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selector: Returns the pagination metadata for the pricing list.
 */
export const selectPaginatedPricingPagination = createSelector(
  [selectPaginatedPricingState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` if the pricing list is loaded and empty.
 */
export const selectPaginatedPricingIsEmpty = createSelector(
  [selectPaginatedPricingData, selectPaginatedPricingLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selector: Returns the total number of pricing records across all pages.
 */
export const selectPaginatedPricingTotalRecords = createSelector(
  [selectPaginatedPricingPagination],
  (pagination) => pagination?.totalRecords ?? 0
);
