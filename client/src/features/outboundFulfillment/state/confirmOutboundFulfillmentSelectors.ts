import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector — gets the confirmOutboundFulfillment slice state.
 */
const selectConfirmOutboundFulfillmentState = (state: RootState) =>
  selectRuntime(state).confirmOutboundFulfillment;

/**
 * Selector: data
 * Returns the confirmation result data from the state.
 */
export const selectConfirmedFulfillmentData = createSelector(
  [selectConfirmOutboundFulfillmentState],
  (state) => state.data
);

/**
 * Selector: loading
 * Returns whether the confirmation request is in progress.
 */
export const selectConfirmFulfillmentLoading = createSelector(
  [selectConfirmOutboundFulfillmentState],
  (state) => state.loading
);

/**
 * Selector: error
 * Returns the latest error message, if any.
 */
export const selectConfirmFulfillmentError = createSelector(
  [selectConfirmOutboundFulfillmentState],
  (state) => state.error
);

/**
 * Selector: lastConfirmedAt
 * Returns the timestamp of the most recent successful confirmation.
 */
export const selectLastConfirmedAt = createSelector(
  [selectConfirmOutboundFulfillmentState],
  (state) => state.lastConfirmedAt
);

/**
 * Combined selector — returns a summarized view of confirmation state.
 * Useful for UI components that need multiple properties.
 */
export const selectConfirmFulfillmentSummary = createSelector(
  [
    selectConfirmFulfillmentLoading,
    selectConfirmFulfillmentError,
    selectConfirmedFulfillmentData,
    selectLastConfirmedAt,
  ],
  (loading, error, data, lastConfirmedAt) => ({
    loading,
    error,
    data,
    lastConfirmedAt,
    isSuccess: Boolean(data && !error),
  })
);
