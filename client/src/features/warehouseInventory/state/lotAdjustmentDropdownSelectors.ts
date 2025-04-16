import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

// Base Selector: Gets the lotAdjustment slice
const selectLotAdjustmentState = (state: RootState) =>
  state.lotAdjustmentsDropdown;

// Selector to Get Lot Adjustment Types
export const selectLotAdjustmentTypes = createSelector(
  [selectLotAdjustmentState],
  (lotAdjustment) => lotAdjustment.types
);

// Selector to Check if Loading
export const selectLotAdjustmentLoading = createSelector(
  [selectLotAdjustmentState],
  (lotAdjustment) => lotAdjustment.loading
);

// Selector to Get Errors
export const selectLotAdjustmentError = createSelector(
  [selectLotAdjustmentState],
  (lotAdjustment) => lotAdjustment.error
);
