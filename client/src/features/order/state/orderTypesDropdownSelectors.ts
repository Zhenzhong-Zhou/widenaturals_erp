import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store.ts';

const selectOrderTypeState = (state: RootState) => state.orderTypesDropdown;

// Memoized selector to get order types
export const selectOrderTypesDropdown = createSelector(
  [selectOrderTypeState],
  (orderTypeState) => orderTypeState.orderTypes ?? [] // Ensure it always returns an array
);

// Memoized selector to get loading state
export const selectOrderTypesDropdownLoading = createSelector(
  [selectOrderTypeState],
  (orderTypeState) => orderTypeState.loading
);

// Memoized selector to get error state
export const selectOrderTypesDropdownError = createSelector(
  [selectOrderTypeState],
  (orderTypeState) => orderTypeState.error
);
