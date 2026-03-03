import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/* ============================================================
   Base Selector
   ============================================================ */

/**
 * selectPaginatedLocationTypesState
 *
 * Base selector for the paginated location type slice.
 *
 * Responsibilities:
 * - Extract the `paginatedLocationTypes` state from runtime
 *
 * Design notes:
 * - MUST be a plain function
 * - MUST NOT use `createSelector`
 * - Prevents identity-selector warnings
 *
 * @param state Root redux state
 */
const selectPaginatedLocationTypesState = (state: RootState) =>
  selectRuntime(state).paginatedLocationTypes;

/* ============================================================
   Derived Selectors
   ============================================================ */

/**
 * Selector: Returns flattened, UI-ready location type rows.
 */
export const selectPaginatedLocationTypeData = createSelector(
  [selectPaginatedLocationTypesState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the location type request is loading.
 */
export const selectPaginatedLocationTypeLoading = createSelector(
  [selectPaginatedLocationTypesState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from location type state, if any.
 */
export const selectPaginatedLocationTypeError = createSelector(
  [selectPaginatedLocationTypesState],
  (state): string | null =>
    state.error?.message ?? null
);

/**
 * Selector: Returns pagination metadata for the location type list.
 */
export const selectPaginatedLocationTypePagination = createSelector(
  [selectPaginatedLocationTypesState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` only if the location type list
 * is loaded and empty.
 */
export const selectPaginatedLocationTypeIsEmpty = createSelector(
  [selectPaginatedLocationTypeData, selectPaginatedLocationTypeLoading],
  (data, loading) => !loading && data.length === 0
);

/* ============================================================
   Selector Factory
   ============================================================ */

/**
 * Selector factory: Returns a selector that resolves
 * a single location type row by ID.
 *
 * Must be a factory to prevent selector cache collisions
 * when multiple components request different IDs concurrently.
 */
export const makeSelectLocationTypeById = () =>
  createSelector(
    [selectPaginatedLocationTypeData, (_: RootState, id: string) => id],
    (records, id) => records.find((record) => record.id === id) ?? null
  );
