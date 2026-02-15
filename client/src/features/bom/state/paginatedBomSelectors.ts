import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the paginated BOM list state slice.
 *
 * Responsibilities:
 * - Extract the paginated BOM state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - No memoization or transformation
 */
const selectBomState = (state: RootState) => selectRuntime(state).paginatedBoms;

/**
 * Selects the current list of BOM records.
 */
export const selectBomData = createSelector(
  [selectBomState],
  (boms) => boms.data
);

/**
 * Selects pagination metadata for the BOM list.
 *
 * Includes page, limit, totalRecords, and totalPages.
 */
export const selectBomPagination = createSelector(
  [selectBomState],
  (boms) => boms.pagination
);

/**
 * Selects the active filter set applied to BOM queries.
 */
export const selectBomFilters = createSelector(
  [selectBomState],
  (boms) => boms.filters
);

/**
 * Selects whether the BOM list request is currently loading.
 */
export const selectBomLoading = createSelector(
  [selectBomState],
  (boms) => boms.loading
);

/**
 * Selects any error message from the BOM list state.
 */
export const selectBomError = createSelector(
  [selectBomState],
  (boms) => boms.error
);

/**
 * Selects the total number of BOM records available.
 *
 * Defaults to 0 when pagination metadata is missing.
 */
export const selectBomTotalRecords = createSelector(
  [selectBomPagination],
  (pagination) => pagination?.totalRecords ?? 0
);

/**
 * Returns true when the BOM list is loaded and contains no records.
 */
export const selectIsBomListEmpty = createSelector(
  [selectBomData, selectBomLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Returns true if additional BOM pages are available for pagination.
 *
 * Commonly used by infinite-scroll and paginated table views.
 */
export const selectHasMoreBomPages = createSelector(
  [selectBomPagination],
  (pagination) => pagination !== null && pagination.page < pagination.totalPages
);
