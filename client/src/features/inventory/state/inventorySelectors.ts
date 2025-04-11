import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Select raw inventory state
 */
const selectInventoryState = (state: RootState) => state.inventories;

/**
 * Selects the inventory list.
 */
export const selectInventories = createSelector(
  [selectInventoryState],
  (inventoryState) => inventoryState.inventories
);

/**
 * Selects pagination details.
 */
export const selectInventoryPagination = createSelector(
  [selectInventoryState],
  (inventoryState) => inventoryState.pagination
);

/**
 * Selects loading state.
 */
export const selectInventoryLoading = createSelector(
  [selectInventoryState],
  (inventoryState) => inventoryState.loading
);

/**
 * Selects error message.
 */
export const selectInventoryError = createSelector(
  [selectInventoryState],
  (inventoryState) => inventoryState.error
);

/**
 * Selects whether data is currently being fetched.
 */
export const selectIsFetchingInventory = createSelector(
  [selectInventoryLoading, selectInventories],
  (loading, inventories) => loading && inventories.length === 0
);
