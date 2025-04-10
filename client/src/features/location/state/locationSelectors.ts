import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';

/**
 * Select the entire locations state.
 */
const selectLocationState = (state: RootState) => state.locations;

/**
 * Select the list of locations.
 */
export const selectLocations = createSelector(
  [selectLocationState],
  (locationState) => locationState.locations
);

/**
 * Select pagination details.
 */
export const selectLocationPagination = createSelector(
  [selectLocationState],
  (locationState) => locationState.pagination
);

/**
 * Select loading state.
 */
export const selectLocationLoading = createSelector(
  [selectLocationState],
  (locationState) => locationState.loading
);

/**
 * Select error message.
 */
export const selectLocationError = createSelector(
  [selectLocationState],
  (locationState) => locationState.error
);
