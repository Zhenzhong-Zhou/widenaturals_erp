import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';
import type { LocationTypesState } from '@features/locationType/state/locationTypesSlice';

/**
 * Base selector for the locationTypes slice.
 */
const selectLocationTypesState= createSelector(
  [selectRuntime],
  (runtime) => runtime.locationTypes as LocationTypesState
);

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
