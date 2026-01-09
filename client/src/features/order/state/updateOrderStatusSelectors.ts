import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector to access the update order status slice from the Redux state.
 */
const selectUpdateOrderStatusState= createSelector(
  [selectRuntime],
  (runtime) => runtime.updateOrderStatus
);

/**
 * Selector to retrieve the loading state of the update order status operation.
 *
 * @returns `true` if the update is in progress, otherwise `false`.
 */
export const selectUpdateOrderStatusLoading = createSelector(
  selectUpdateOrderStatusState,
  (state) => state.loading
);

/**
 * Selector to retrieve any error message related to updating order status.
 *
 * @returns A string error message if the request failed, otherwise `null`.
 */
export const selectUpdateOrderStatusError = createSelector(
  selectUpdateOrderStatusState,
  (state) => state.error
);

/**
 * Selector to retrieve the successful response data after updating order status.
 *
 * @returns The `UpdateOrderStatusResponse` object if the update succeeded, otherwise `null`.
 */
export const selectUpdatedOrderStatusData = createSelector(
  selectUpdateOrderStatusState,
  (state) => state.data
);
