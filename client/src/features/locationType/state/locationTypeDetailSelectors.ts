import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the locationType slice.
 *
 * Internal-only extraction selector.
 * MUST remain a plain function.
 */
const selectLocationTypeState = (state: RootState) =>
  selectRuntime(state).locationType;

/**
 * Selects the location type detail payload.
 *
 * This represents the resolved location type entity
 * returned from the API.
 */
export const selectLocationTypeDetail = createSelector(
  [selectLocationTypeState],
  (locationTypeState) => locationTypeState.data
);

/**
 * Selects the list of locations belonging to the current location type.
 *
 * Returns an empty array if no data is available yet.
 */
export const selectLocationTypeLocations = createSelector(
  [selectLocationTypeDetail],
  (locationType) => locationType?.data ?? []
);

/**
 * Selects pagination metadata for the location type detail view.
 */
export const selectLocationTypePagination = createSelector(
  [selectLocationTypeState],
  (locationTypeState) => locationTypeState.pagination
);

/**
 * Selects loading state for location type requests.
 */
export const selectLocationTypeLoading = createSelector(
  [selectLocationTypeState],
  (locationTypeState) => locationTypeState.loading
);

/**
 * Selects error message from the location type slice, if any.
 */
export const selectLocationTypeError = createSelector(
  [selectLocationTypeState],
  (locationTypeState) => locationTypeState.error
);
