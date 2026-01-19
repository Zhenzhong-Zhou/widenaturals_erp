import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the locations state slice.
 *
 * Responsibilities:
 * - Extract the locations state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - Internal implementation detail
 */
const selectLocationState = (state: RootState) =>
  selectRuntime(state).locations;

/**
 * Selects the list of locations.
 */
export const selectLocations = createSelector(
  [selectLocationState],
  (locationState) => locationState.locations
);

/**
 * Selects pagination metadata for locations.
 */
export const selectLocationPagination = createSelector(
  [selectLocationState],
  (locationState) => locationState.pagination
);

/**
 * Selects whether the locations request is currently loading.
 */
export const selectLocationLoading = createSelector(
  [selectLocationState],
  (locationState) => locationState.loading
);

/**
 * Selects any error message from the locations request.
 */
export const selectLocationError = createSelector(
  [selectLocationState],
  (locationState) => locationState.error
);
