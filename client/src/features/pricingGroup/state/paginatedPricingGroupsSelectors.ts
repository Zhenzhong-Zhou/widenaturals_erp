import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * selectPaginatedPricingGroupsState
 *
 * Base selector for the paginated pricing group slice.
 *
 * Responsibilities:
 * - Extract the `paginatedPricingGroups` state from runtime
 *
 * Design notes:
 * - MUST be a plain function
 * - MUST NOT use `createSelector`
 * - This avoids identity-selector warnings
 *
 * @param state Root redux state
 */
const selectPaginatedPricingGroupsState = (state: RootState) =>
  selectRuntime(state).paginatedPricingGroups;

/**
 * Selector: Returns the array of pricing group records.
 */
export const selectPaginatedPricingGroupData = createSelector(
  [selectPaginatedPricingGroupsState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the pricing group request is currently loading.
 */
export const selectPaginatedPricingGroupLoading = createSelector(
  [selectPaginatedPricingGroupsState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the pricing group state, if any.
 */
export const selectPaginatedPricingGroupError = createSelector(
  [selectPaginatedPricingGroupsState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selector: Returns the pagination metadata for the pricing group list.
 */
export const selectPaginatedPricingGroupPagination = createSelector(
  [selectPaginatedPricingGroupsState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` only if the pricing group list is loaded and empty.
 */
export const selectPaginatedPricingGroupIsEmpty = createSelector(
  [selectPaginatedPricingGroupData, selectPaginatedPricingGroupLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selector factory: Returns a selector that resolves
 * a single pricing group record by ID.
 *
 * Must be used as a factory to avoid selector cache collisions
 * when multiple rows are rendered concurrently.
 */
export const makeSelectPricingGroupById = () =>
  createSelector(
    [selectPaginatedPricingGroupData, (_: RootState, id: string) => id],
    (records, id) => records.find((record) => record.id === id) ?? null
  );
