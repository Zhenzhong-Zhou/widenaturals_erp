import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

// Base slice selector
const selectConfirmSalesOrderState = (state: RootState) => state.confirmSalesOrder;

// Memoized selectors
export const selectConfirmOrderData = createSelector(
  [selectConfirmSalesOrderState],
  (state) => state.data
);

export const selectConfirmOrderLoading = createSelector(
  [selectConfirmSalesOrderState],
  (state) => state.loading
);

export const selectConfirmOrderError = createSelector(
  [selectConfirmSalesOrderState],
  (state) => state.error
);

export const selectConfirmOrderSuccessMessage = createSelector(
  [selectConfirmSalesOrderState],
  (state) => state.successMessage
);
