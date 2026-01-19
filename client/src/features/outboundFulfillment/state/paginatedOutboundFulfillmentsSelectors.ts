import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector to access the paginated outbound fulfillments slice
 * from the Redux store.
 */
const selectPaginatedOutboundFulfillmentsState = (state: RootState) =>
  selectRuntime(state).paginatedOutboundFulfillments;

/**
 * Selector to get the loading state of outbound fulfillments.
 *
 * @returns {boolean} `true` if a fetch request is in progress, else `false`.
 */
export const selectPaginatedOutboundFulfillmentsLoading = createSelector(
  [selectPaginatedOutboundFulfillmentsState],
  (state) => state.loading
);

/**
 * Selector to get the error message for outbound fulfillments.
 *
 * @returns {string | null} Error message string if present, otherwise `null`.
 */
export const selectPaginatedOutboundFulfillmentsError = createSelector(
  [selectPaginatedOutboundFulfillmentsState],
  (state) => state.error
);

/**
 * Selector to get the list of outbound shipment records.
 *
 * @returns {OutboundShipmentRecord[]} Array of outbound fulfillment records.
 */
export const selectPaginatedOutboundFulfillmentsData = createSelector(
  [selectPaginatedOutboundFulfillmentsState],
  (state) => state.data
);

/**
 * Selector to get the pagination metadata for outbound fulfillments.
 *
 * @returns {Pagination | null} Pagination object if available, otherwise `null`.
 */
export const selectPaginatedOutboundFulfillmentsPagination = createSelector(
  [selectPaginatedOutboundFulfillmentsState],
  (state) => state.pagination
);

/**
 * Derived selector to check whether there are any outbound fulfillments
 * in the current data set.
 *
 * @returns {boolean} `true` if at least one record exists, else `false`.
 */
export const selectHasPaginatedOutboundFulfillments = createSelector(
  [selectPaginatedOutboundFulfillmentsData],
  (data) => data.length > 0
);

/**
 * Derived selector to get the total number of outbound fulfillment records
 * from pagination metadata.
 *
 * @returns {number} Total record count, defaults to `0` if not available.
 */
export const selectPaginatedOutboundFulfillmentsTotalRecords = createSelector(
  [selectPaginatedOutboundFulfillmentsPagination],
  (pagination) => pagination?.totalRecords ?? 0
);
