import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { AvailableInventoryLot } from '@features/inventoryAllocation';

// Base selector
export const selectAvailableInventoryLotsState = (state: RootState) =>
  state.availableInventoryLots;

// Individual selectors
export const selectAvailableInventoryLots = createSelector(
  [selectAvailableInventoryLotsState],
  (state) => state.lots
);

export const selectAvailableInventoryLotsLoading = createSelector(
  [selectAvailableInventoryLotsState],
  (state) => state.loading
);

export const selectAvailableInventoryLotsError = createSelector(
  [selectAvailableInventoryLotsState],
  (state) => state.error
);

export const selectTotalAvailableQuantity = createSelector(
  [selectAvailableInventoryLots],
  (lots: AvailableInventoryLot[]) =>
    lots.reduce((total, lot) => total + (lot.availableQuantity || 0), 0)
);
