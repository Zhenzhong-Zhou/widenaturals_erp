import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { CustomerListItem } from './customerTypes';

/**
 * Base selector for the paginated customers state slice.
 *
 * Responsibilities:
 * - Extract the paginated customers state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - No memoization or transformation
 */
const selectPaginatedCustomersState = (state: RootState) =>
  selectRuntime(state).paginatedCustomers;

/**
 * Selects the list of customers for the current page.
 */
export const selectPaginatedCustomers = createSelector(
  [selectPaginatedCustomersState],
  (state): CustomerListItem[] => state.data
);

/**
 * Selects pagination metadata for the customer list.
 *
 * Includes page, limit, totalRecords, and totalPages.
 */
export const selectPaginatedCustomersPagination = createSelector(
  [selectPaginatedCustomersState],
  (state) => state.pagination
);

/**
 * Selects whether the customer fetch request is currently loading.
 */
export const selectPaginatedCustomersLoading = createSelector(
  [selectPaginatedCustomersState],
  (state) => state.loading
);

/**
 * Selects any error message from the customer fetch request.
 */
export const selectPaginatedCustomersError = createSelector(
  [selectPaginatedCustomersState],
  (state) => state.error
);

/**
 * Selects the current page number.
 *
 * Defaults to 1 when pagination metadata is unavailable.
 */
export const selectPaginatedCustomersPage = createSelector(
  [selectPaginatedCustomersPagination],
  (pagination) => pagination?.page ?? 1
);

/**
 * Selects the current page size (customers per page).
 *
 * Defaults to 10 when pagination metadata is unavailable.
 */
export const selectPaginatedCustomersLimit = createSelector(
  [selectPaginatedCustomersPagination],
  (pagination) => pagination?.limit ?? 10
);

/**
 * Selects the total number of customer records available.
 */
export const selectPaginatedCustomersTotalRecords = createSelector(
  [selectPaginatedCustomersPagination],
  (pagination) => pagination?.totalRecords ?? 0
);

/**
 * Selects the total number of pages available.
 */
export const selectPaginatedCustomersTotalPages = createSelector(
  [selectPaginatedCustomersPagination],
  (pagination) => pagination?.totalPages ?? 1
);
