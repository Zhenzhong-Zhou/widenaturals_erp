import { RootState } from '@store/store.ts';
import { LocationTypesState } from '@features/locationType/state/locationTypesSlice.ts';
import { createSelector } from '@reduxjs/toolkit';

/**
 * Base selector for the locationTypes slice.
 */
export const selectLocationTypesState = (state: RootState): LocationTypesState =>
  state.locationTypes as LocationTypesState;

/**
 * Selects the list of location types.
 */
export const selectLocationTypes = createSelector(
  selectLocationTypesState,
  (state) => state.data
);

/**
 * Selects pagination details.
 */
export const selectLocationTypesPagination = createSelector(
  selectLocationTypesState,
  (state) => state.pagination
);

/**
 * Selects loading state.
 */
export const selectLocationTypesLoading = createSelector(
  selectLocationTypesState,
  (state) => state.loading
);

/**
 * Selects error message.
 */
export const selectLocationTypesError = createSelector(
  selectLocationTypesState,
  (state) => state.error
);
