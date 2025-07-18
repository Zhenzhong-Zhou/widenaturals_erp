import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector for the `createWarehouseInventory` slice.
 *
 * @param state - The Redux root state.
 * @returns The state slice for create warehouse inventory.
 */
const selectCreateWarehouseInventorySlice = (state: RootState) =>
  state.createWarehouseInventory;

/**
 * Selector for extracting relevant state from the createWarehouseInventory slice.
 *
 * This selector returns:
 * - Normalized warehouse and location inventory data (defaulting to empty arrays)
 * - Message and success flag from the API response (defaulting to empty string / false)
 * - Loading and error state of the mutation
 *
 * Use this in components that need to render inventory creation results or status feedback.
 *
 * @returns An object with `warehouse`, `location`, `message`, `success`, `loading`, and `error`.
 */
export const selectCreatedWarehouseRecords = createSelector(
  [selectCreateWarehouseInventorySlice],
  (slice) => ({
    warehouse: slice.data?.data.warehouse ?? [],
    location: slice.data?.data.location ?? [],
    message: slice.data?.message ?? '',
    success: slice.data?.success ?? false,
    loading: slice.loading,
    error: slice.error,
  })
);
