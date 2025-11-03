import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { OrderQueryParams } from '@features/order/state/orderTypes';

/**
 * Base selector to retrieve the entire paginated orders slice from the Redux state.
 */
export const selectPaginatedOrdersState = (state: RootState) =>
  state.paginatedOrders;

/**
 * Selector to retrieve the current list of paginated orders.
 * Uses memoization to avoid unnecessary re-renders when state hasn't changed.
 */
export const selectPaginatedOrders = createSelector(
  [selectPaginatedOrdersState],
  (state) => state.data
);

/**
 * Selector to retrieve pagination metadata for the current order list view.
 * Includes page number, page size, total records, and total pages.
 */
export const selectOrderPagination = createSelector(
  [selectPaginatedOrdersState],
  (state) => state.pagination
);

/**
 * Selector to retrieve the active filter parameters used to query the order list.
 */
export const selectOrderFilters = createSelector(
  [selectPaginatedOrdersState],
  (state): OrderQueryParams => state.filters
);

/**
 * Selector to retrieve the loading state for the paginated orders request.
 * Returns true if a fetch request is in progress.
 */
export const selectOrdersLoading = createSelector(
  [selectPaginatedOrdersState],
  (state) => state.loading
);

/**
 * Selector to retrieve the error message from the most recent order list request, if any.
 */
export const selectOrdersError = createSelector(
  [selectPaginatedOrdersState],
  (state) => state.error
);
