import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector to access the entire initiateOutboundFulfillment slice state.
 */
const selectInitiateOutboundFulfillmentState = (state: RootState) =>
  state.initiateOutboundFulfillment;

/**
 * Selector to get the loading state of outbound fulfillment initiation.
 *
 * @returns {boolean} Whether the API request is currently in progress.
 */
export const selectInitiateOutboundFulfillmentLoading = createSelector(
  [selectInitiateOutboundFulfillmentState],
  (state) => state.loading
);

/**
 * Selector to get the error message from outbound fulfillment initiation.
 *
 * @returns {string | null} Error message if the request failed, otherwise null.
 */
export const selectInitiateOutboundFulfillmentError = createSelector(
  [selectInitiateOutboundFulfillmentState],
  (state) => state.error
);

/**
 * Selector to get the data payload from outbound fulfillment initiation.
 *
 * @returns {InitiateFulfillmentData | null} Response payload if available, otherwise null.
 */
export const selectInitiateOutboundFulfillmentData = createSelector(
  [selectInitiateOutboundFulfillmentState],
  (state) => state.data
);

/**
 * Selector to check if outbound fulfillment initiation has any data.
 *
 * @returns {boolean} True if data is present, false otherwise.
 */
export const selectHasInitiateOutboundFulfillmentData = createSelector(
  [selectInitiateOutboundFulfillmentData],
  (data) => data !== null
);
