import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * selectPaginatedPricingTypesState
 *
 * Base selector for the paginated pricing type slice.
 *
 * Responsibilities:
 * - Extract the `paginatedPricingTypes` state from runtime
 *
 * Design notes:
 * - MUST be a plain function
 * - MUST NOT use `createSelector`
 * - This avoids identity-selector warnings
 *
 * @param state Root redux state
 */
const selectPaginatedPricingTypesState = (state: RootState) =>
  selectRuntime(state).paginatedPricingTypes;

/**
 * Selector: Returns the array of pricing type records.
 */
export const selectPaginatedPricingTypeData = createSelector(
  [selectPaginatedPricingTypesState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the pricing type request is currently loading.
 */
export const selectPaginatedPricingTypeLoading = createSelector(
  [selectPaginatedPricingTypesState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the pricing type state, if any.
 */
export const selectPaginatedPricingTypeError = createSelector(
  [selectPaginatedPricingTypesState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selector: Returns the pagination metadata for the pricing type list.
 */
export const selectPaginatedPricingTypePagination = createSelector(
  [selectPaginatedPricingTypesState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` only if the pricing type list is loaded and empty.
 */
export const selectPaginatedPricingTypeIsEmpty = createSelector(
  [selectPaginatedPricingTypeData, selectPaginatedPricingTypeLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selector factory: Returns a selector that resolves
 * a single pricing type record by ID.
 *
 * Must be used as a factory to avoid selector cache collisions
 * when multiple rows are rendered concurrently.
 */
export const makeSelectPricingTypeById = () =>
  createSelector(
    [selectPaginatedPricingTypeData, (_: RootState, id: string) => id],
    (records, id) => records.find((record) => record.id === id) ?? null
  );
