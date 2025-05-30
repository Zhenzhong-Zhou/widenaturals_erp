import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector for the `createWarehouseInventory` slice.
 *
 * @param state - The Redux root state.
 * @returns The state slice for create warehouse inventory.
 */
const selectCreateWarehouseInventorySlice = (state: RootState) => state.createWarehouseInventory;

/**
 * Composite selector for the entire inventory creation state.
 *
 * @returns An object containing `loading`, `error`, `success`, and `response`.
 */
export const selectCreateWarehouseInventoryState = createSelector(
  [selectCreateWarehouseInventorySlice],
  (slice) => ({
    loading: slice.loading,
    error: slice.error,
    success: slice.success,
    response: slice.response,
  })
);
