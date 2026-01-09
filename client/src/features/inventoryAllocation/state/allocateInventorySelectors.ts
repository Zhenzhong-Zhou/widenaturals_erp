import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector to access the allocateInventory slice from the global state.
 */
const selectAllocateInventoryState = createSelector(
  [selectRuntime],
  (runtime) => runtime.allocateInventory
);

/**
 * Selector to retrieve the full allocation data (orderId + allocationIds).
 */
export const selectAllocationData = createSelector(
  [selectAllocateInventoryState],
  (state) => state.data
);

/**
 * Selector to determine if the allocation request is currently loading.
 */
export const selectAllocationLoading = createSelector(
  [selectAllocateInventoryState],
  (state) => state.loading
);

/**
 * Selector to retrieve the error message from a failed allocation request.
 */
export const selectAllocationError = createSelector(
  [selectAllocateInventoryState],
  (state) => state.error
);

/**
 * Selector to extract the allocated order ID (if available).
 */
export const selectAllocationOrderId = createSelector(
  [selectAllocateInventoryState],
  (state) => state.data?.orderId || null
);

/**
 * Selector to extract the list of allocated inventory IDs (if available).
 */
export const selectAllocatedIds = createSelector(
  [selectAllocateInventoryState],
  (state) => state.data?.allocationIds || []
);
