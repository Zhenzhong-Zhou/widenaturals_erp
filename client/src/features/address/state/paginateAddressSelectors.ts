import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector to access the paginate address slice state.
 */
const selectPaginateAddressState = (state: RootState) => state.paginateAddress;

/**
 * Selector to get the list of paginated address records.
 */
export const selectPaginatedAddresses = createSelector(
  selectPaginateAddressState,
  (state) => state.data
);

/**
 * Selector to get the pagination metadata (e.g. page, limit, totalRecords, totalPages).
 */
export const selectPaginationMeta = createSelector(
  selectPaginateAddressState,
  (state) => state.pagination
);

/**
 * Selector to determine if a paginated address request is currently loading.
 */
export const selectPaginateLoading = createSelector(
  selectPaginateAddressState,
  (state) => state.loading
);

/**
 * Selector to get any error message from the paginated address request.
 */
export const selectPaginateError = createSelector(
  selectPaginateAddressState,
  (state) => state.error
);
