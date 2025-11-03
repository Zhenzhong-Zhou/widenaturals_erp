import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector to access the completeManualFulfillment slice.
 */
export const selectCompleteManualFulfillmentState = (state: RootState) =>
  state.completeManualFulfillment;

/**
 * Selector for the loading state of manual fulfillment completion.
 */
export const selectCompleteManualFulfillmentLoading = createSelector(
  selectCompleteManualFulfillmentState,
  (state) => state.loading
);

/**
 * Selector for the response data of manual fulfillment completion.
 */
export const selectCompleteManualFulfillmentData = createSelector(
  selectCompleteManualFulfillmentState,
  (state) => state.data
);

/**
 * Selector for the error message (if any) during manual fulfillment completion.
 */
export const selectCompleteManualFulfillmentError = createSelector(
  selectCompleteManualFulfillmentState,
  (state) => state.error
);

/**
 * Combined selector for manual fulfillment completion state.
 *
 * Selects and returns a memoized object containing:
 * - `loading`: Indicates whether the manual fulfillment request is in progress.
 * - `data`: The response data returned from a successful manual fulfillment.
 * - `error`: Error message (if any) from a failed manual fulfillment request.
 *
 * This selector is useful for destructuring all relevant state values at once,
 * improving readability and preventing repetitive selector calls in components.
 *
 * Example usage:
 * ```ts
 * const { loading, data, error } = useAppSelector(selectCompleteManualFulfillmentCombined);
 * ```
 */
export const selectCompleteManualFulfillmentCombined = createSelector(
  selectCompleteManualFulfillmentState,
  (state) => ({
    loading: state.loading,
    data: state.data,
    error: state.error,
  })
);
