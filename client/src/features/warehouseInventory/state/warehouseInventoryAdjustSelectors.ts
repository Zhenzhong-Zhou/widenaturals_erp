import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector for the warehouse inventory adjustment slice.
 */
const selectAdjustInventorySlice = (state: RootState) =>
  state.warehouseInventoryAdjust;

/**
 * Memoized selector for the adjusted warehouse inventory state.
 *
 * Returns:
 * - Adjusted warehouse and location inventory records
 * - Response message and success status
 * - Loading and error state flags
 */
export const selectAdjustedInventoryRecords = createSelector(
  [selectAdjustInventorySlice],
  (slice) => ({
    warehouse: slice.data?.data.warehouse ?? [],
    location: slice.data?.data.location ?? [],
    message: slice.data?.message ?? '',
    success: slice.data?.success ?? false,
    loading: slice.loading,
    error: slice.error,
  })
);
