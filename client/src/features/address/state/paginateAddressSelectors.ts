import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the paginated address state slice.
 *
 * Responsibilities:
 * - Extract the paginated address state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - No memoization or transformation
 */
const selectPaginatedAddressState = (state: RootState) =>
  selectRuntime(state).paginatedAddress;

/**
 * Selects the list of paginated address records.
 *
 * Returns an empty array when data is not yet available.
 */
export const selectPaginatedAddresses = createSelector(
  [selectPaginatedAddressState],
  (state) => state?.data ?? []
);

/**
 * Selects pagination metadata for the address list.
 *
 * Includes:
 * - page
 * - limit
 * - totalRecords
 * - totalPages
 */
export const selectPaginationMeta = createSelector(
  [selectPaginatedAddressState],
  (state) => state?.pagination ?? null
);

/**
 * Selects whether the paginated address request is currently loading.
 */
export const selectPaginatedAddressLoading = createSelector(
  [selectPaginatedAddressState],
  (state) => state?.loading ?? false
);

/**
 * Selects any error message from the paginated address request.
 */
export const selectPaginatedAddressError = createSelector(
  [selectPaginatedAddressState],
  (state) => state?.error ?? null
);
