import { RootState } from '@store/store.ts';
import { createSelector } from '@reduxjs/toolkit';

// Select raw state
const selectLocationTypeState = (state: RootState) => state.locationType;

/**
 * Selects the location type details.
 */
export const selectLocationTypeDetail = createSelector(
  selectLocationTypeState,
  (locationTypeState) => locationTypeState.data
);

/**
 * Selects the list of locations within the location type.
 */
export const selectLocations = createSelector(
  selectLocationTypeDetail,
  (locationType) => locationType?.locations || []
);

/**
 * Selects pagination details.
 */
export const selectLocationTypePagination = createSelector(
  selectLocationTypeState,
  (locationTypeState) => locationTypeState.pagination
);

/**
 * Selects loading state.
 */
export const selectLocationTypeLoading = createSelector(
  selectLocationTypeState,
  (locationTypeState) => locationTypeState.loading
);

/**
 * Selects error message.
 */
export const selectLocationTypeError = createSelector(
  selectLocationTypeState,
  (locationTypeState) => locationTypeState.error
);
