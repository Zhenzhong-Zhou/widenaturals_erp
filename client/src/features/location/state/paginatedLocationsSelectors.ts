import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/* ============================================================
   Base Selector
   ============================================================ */

/**
 * selectPaginatedLocationsState
 *
 * Base selector for the paginated location slice.
 *
 * Responsibilities:
 * - Extract the `paginatedLocations` state from runtime
 *
 * Design notes:
 * - MUST be a plain function
 * - MUST NOT use `createSelector`
 * - Prevents identity-selector warnings
 *
 * @param state Root redux state
 */
const selectPaginatedLocationsState = (state: RootState) =>
  selectRuntime(state).paginatedLocations;

/* ============================================================
   Derived Selectors
   ============================================================ */

/**
 * Selector: Returns flattened, UI-ready location rows.
 */
export const selectPaginatedLocationData = createSelector(
  [selectPaginatedLocationsState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the location request is loading.
 */
export const selectPaginatedLocationLoading = createSelector(
  [selectPaginatedLocationsState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from location state, if any.
 */
export const selectPaginatedLocationError = createSelector(
  [selectPaginatedLocationsState],
  (state) => state.error
);

/**
 * Selector: Returns pagination metadata for the location list.
 */
export const selectPaginatedLocationPagination = createSelector(
  [selectPaginatedLocationsState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` only if the location list
 * is loaded and empty.
 */
export const selectPaginatedLocationIsEmpty = createSelector(
  [
    selectPaginatedLocationData,
    selectPaginatedLocationLoading,
  ],
  (data, loading) => !loading && data.length === 0
);

/* ============================================================
   Selector Factory
   ============================================================ */

/**
 * Selector factory: Returns a selector that resolves
 * a single location row by ID.
 *
 * Must be a factory to prevent selector cache collisions
 * when multiple components request different IDs concurrently.
 */
export const makeSelectLocationById = () =>
  createSelector(
    [
      selectPaginatedLocationData,
      (_: RootState, id: string) => id,
    ],
    (records, id) =>
      records.find((record) => record.id === id) ?? null
  );
