import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';
import type { CustomerListItem } from './customerTypes';

/**
 * Base selector for the paginatedCustomers slice.
 */
const selectPaginatedCustomersState= createSelector(
  [selectRuntime],
  (runtime) => runtime.paginatedCustomers
);

/**
 * Selector for the list of customers.
 *
 * @returns {CustomerListItem[]} - The currently visible customer data.
 */
export const selectPaginatedCustomers = createSelector(
  [selectPaginatedCustomersState],
  (state): CustomerListItem[] => state.data
);

/**
 * Selector for the pagination metadata (page, limit, totalRecords, totalPages).
 */
export const selectPaginatedCustomersPagination = createSelector(
  [selectPaginatedCustomersState],
  (state) => state.pagination
);

/**
 * Selector for the loading state of the customer fetch operation.
 *
 * @returns {boolean} - True if fetch is in progress.
 */
export const selectPaginatedCustomersLoading = createSelector(
  [selectPaginatedCustomersState],
  (state) => state.loading
);

/**
 * Selector for the error message if fetching customers failed.
 *
 * @returns {string | null} - Error message or null if no error.
 */
export const selectPaginatedCustomersError = createSelector(
  [selectPaginatedCustomersState],
  (state) => state.error
);

/**
 * Selector for the current page number.
 *
 * @returns {number} - Current page.
 */
export const selectPaginatedCustomersPage = createSelector(
  [selectPaginatedCustomersPagination],
  (pagination) => pagination?.page ?? 1
);

/**
 * Selector for the current pagination limit (number of customers per page).
 *
 * Useful for determining how many records are shown per page in paginated views.
 *
 * @returns {number} - Number of customers per page.
 */
export const selectPaginatedCustomersLimit = createSelector(
  [selectPaginatedCustomersPagination],
  (pagination) => pagination?.limit ?? 10
);

/**
 * Selector for the total number of customer records available.
 *
 * @returns {number} - Total records count.
 */
export const selectPaginatedCustomersTotalRecords = createSelector(
  [selectPaginatedCustomersPagination],
  (pagination) => pagination?.totalRecords ?? 0
);

/**
 * Selector for the total number of pages available.
 *
 * @returns {number} - Total page count.
 */
export const selectPaginatedCustomersTotalPages = createSelector(
  [selectPaginatedCustomersPagination],
  (pagination) => pagination?.totalPages ?? 1
);
