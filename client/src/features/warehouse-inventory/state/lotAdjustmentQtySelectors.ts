import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store.ts';

// Base selectors
const selectLotAdjustmentState = (state: RootState) => state.lotAdjustmentQty;

// Single Lot Adjustment Selectors
export const selectLotAdjustmentQtyLoadingSingle = createSelector(
  selectLotAdjustmentState,
  (lotAdjustment) => lotAdjustment.loadingSingle
);

export const selectLotAdjustmentQtySuccessSingle = createSelector(
  selectLotAdjustmentState,
  (lotAdjustment) => lotAdjustment.successSingle
);

export const selectLotAdjustmentQtyErrorSingle = createSelector(
  selectLotAdjustmentState,
  (lotAdjustment) => lotAdjustment.errorSingle
);

// Bulk Lot Adjustment Selectors
export const selectLotAdjustmentQtyLoadingBulk = createSelector(
  selectLotAdjustmentState,
  (lotAdjustment) => lotAdjustment.loadingBulk
);

export const selectLotAdjustmentQtySuccessBulk = createSelector(
  selectLotAdjustmentState,
  (lotAdjustment) => lotAdjustment.successBulk
);

export const selectLotAdjustmentQtyErrorBulk = createSelector(
  selectLotAdjustmentState,
  (lotAdjustment) => lotAdjustment.errorBulk
);
