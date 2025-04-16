import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

// Base Selector
const selectInsertedInventoryRecordsResponseState = (state: RootState) =>
  state.insertedInventoryRecordsResponse;

// Memoized Selectors
export const selectInsertedInventoryRecordsResponseData = createSelector(
  [selectInsertedInventoryRecordsResponseState],
  (insertedInventory) => insertedInventory.data
);

export const selectInsertedInventoryRecordsResponseLoading = createSelector(
  [selectInsertedInventoryRecordsResponseState],
  (insertedInventory) => insertedInventory.loading
);

export const selectInsertedInventoryRecordsResponseError = createSelector(
  [selectInsertedInventoryRecordsResponseState],
  (insertedInventory) => insertedInventory.error
);
