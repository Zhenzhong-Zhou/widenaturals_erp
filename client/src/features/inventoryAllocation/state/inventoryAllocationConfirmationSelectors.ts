import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the inventory allocation confirmation state slice.
 *
 * Responsibilities:
 * - Extract the inventory allocation confirmation state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - Internal implementation detail
 */
const selectInventoryAllocationConfirmation = (state: RootState) =>
  selectRuntime(state).inventoryAllocationConfirmation;

/**
 * Selects whether the inventory allocation confirmation request is currently loading.
 */
export const selectAllocationConfirmLoading = createSelector(
  [selectInventoryAllocationConfirmation],
  (state) => state.loading
);

/**
 * Selects any error message from the inventory allocation confirmation process.
 */
export const selectAllocationConfirmError = createSelector(
  [selectInventoryAllocationConfirmation],
  (state) => state.error
);

/**
 * Selects the full API response from the inventory allocation confirmation.
 *
 * Includes:
 * - success
 * - message
 * - data
 */
export const selectAllocationConfirmResponse = createSelector(
  [selectInventoryAllocationConfirmation],
  (state) => state.data
);

/**
 * Selects the `success` flag from the allocation confirmation response.
 *
 * Returns `false` when the response is not yet available.
 */
export const selectAllocationConfirmSuccess = createSelector(
  [selectAllocationConfirmResponse],
  (response) => response?.success ?? false
);

/**
 * Selects the confirmation message from the allocation confirmation response.
 */
export const selectAllocationConfirmMessage = createSelector(
  [selectAllocationConfirmResponse],
  (response) => response?.message ?? null
);

/**
 * Selects the confirmed allocation payload from the response.
 *
 * Includes fields such as `orderId` and `allocationIds`.
 */
export const selectAllocationConfirmPayload = createSelector(
  [selectAllocationConfirmResponse],
  (response) => response?.data ?? null
);
