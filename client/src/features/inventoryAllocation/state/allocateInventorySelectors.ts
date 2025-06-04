import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { InventoryAllocationResponse } from '@features/inventoryAllocation';

// Base selector for the allocateInventory slice
const selectAllocateInventoryState = (state: RootState) => state.allocateInventory;

// Memoized selector for loading state
export const selectIsAllocatingInventory = createSelector(
  [selectAllocateInventoryState],
  (state) => state.loading
);

// Memoized selector for success flag
export const selectInventoryAllocationSuccess = createSelector(
  [selectAllocateInventoryState],
  (state) => state.success
);

// Memoized selector for error message
export const selectInventoryAllocationError = createSelector(
  [selectAllocateInventoryState],
  (state) => state.error
);

// Memoized selector for allocation response data
export const selectInventoryAllocationData = createSelector(
  [selectAllocateInventoryState],
  (state) => state.data
);

// Memoized selector for total updated items
export const selectTotalAllocatedItems = createSelector(
  [selectInventoryAllocationData],
  (data: InventoryAllocationResponse | null) =>
    data?.allocations.reduce((sum, result) => sum + result.updatedItemCount, 0) ?? 0
);

// Memoized selector for total affected orders
export const selectTotalAllocatedOrders = createSelector(
  [selectInventoryAllocationData],
  (data: InventoryAllocationResponse | null) =>
    data?.allocations.length ?? 0
);
