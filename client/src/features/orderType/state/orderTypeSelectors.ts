import { createSelector } from "@reduxjs/toolkit";
import { RootState } from '../../../store/store.ts';

export const selectOrderTypesState = (state: RootState) => state.orderTypes;

// ✅ Memoized selector for order types
export const selectOrderTypes = createSelector(
  [selectOrderTypesState],
  (orderTypesState) => orderTypesState.data
);

// ✅ Memoized selector for loading state
export const selectOrderTypesLoading = createSelector(
  [selectOrderTypesState],
  (orderTypesState) => orderTypesState.loading
);

// ✅ Memoized selector for error state
export const selectOrderTypesError = createSelector(
  [selectOrderTypesState],
  (orderTypesState) => orderTypesState.error
);
