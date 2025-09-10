import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector for the inventory allocation confirmation slice state.
 */
const selectInventoryAllocationConfirmation = (state: RootState) =>
  state.inventoryAllocationConfirmation;

/**
 * Selects the loading state of the inventory allocation confirmation process.
 */
export const selectAllocationConfirmLoading = createSelector(
  [selectInventoryAllocationConfirmation],
  (state) => state.loading
);

/**
 * Selects the error message, if any, from the inventory allocation confirmation process.
 */
export const selectAllocationConfirmError = createSelector(
  [selectInventoryAllocationConfirmation],
  (state) => state.error
);

/**
 * Selects the full API response from the inventory allocation confirmation.
 * This includes `success`, `message`, and `data`.
 */
export const selectAllocationConfirmResponse = createSelector(
  [selectInventoryAllocationConfirmation],
  (state) => state.data
);

/**
 * Selects the `success` flag from the inventory allocation confirmation response.
 *
 * This indicates whether the inventory allocation confirmation API call
 * was successful, based on the server's response payload.
 *
 * @returns {boolean} `true` if the confirmation succeeded, otherwise `false`.
 */
export const selectAllocationConfirmSuccess = createSelector(
  [selectAllocationConfirmResponse],
  (response) => response?.success ?? false
);

/**
 * Selects only the `message` from the inventory allocation confirmation response.
 */
export const selectAllocationConfirmMessage = createSelector(
  [selectAllocationConfirmResponse],
  (response) => response?.message ?? null
);

/**
 * Selects only the confirmed payload data (`orderId`, `allocationIds`, etc.)
 * from the inventory allocation confirmation response.
 */
export const selectAllocationConfirmPayload = createSelector(
  [selectAllocationConfirmResponse],
  (response) => response?.data ?? null
);
