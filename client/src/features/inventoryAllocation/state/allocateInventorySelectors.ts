import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the allocate-inventory state slice.
 *
 * Responsibilities:
 * - Extract the allocate-inventory state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - Internal implementation detail
 */
const selectAllocateInventoryState = (state: RootState) =>
  selectRuntime(state).allocateInventory;

/**
 * Selects the full allocation response payload.
 *
 * Includes:
 * - orderId
 * - allocationIds
 */
export const selectAllocationData = createSelector(
  [selectAllocateInventoryState],
  (state) => state.data
);

/**
 * Selects whether the inventory allocation request is currently loading.
 */
export const selectAllocationLoading = createSelector(
  [selectAllocateInventoryState],
  (state) => state.loading
);

/**
 * Selects any error message from a failed inventory allocation request.
 */
export const selectAllocationError = createSelector(
  [selectAllocateInventoryState],
  (state) => state.error
);

/**
 * Selects the allocated order ID.
 *
 * Returns `null` when allocation data is not yet available.
 */
export const selectAllocationOrderId = createSelector(
  [selectAllocateInventoryState],
  (state) => state.data?.orderId ?? null
);

/**
 * Selects the list of allocated inventory IDs.
 *
 * Returns an empty array when allocation data is not yet available.
 */
export const selectAllocatedIds = createSelector(
  [selectAllocateInventoryState],
  (state) => state.data?.allocationIds ?? []
);
