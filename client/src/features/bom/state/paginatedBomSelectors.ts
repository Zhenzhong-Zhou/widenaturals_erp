import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the BOM slice state.
 */
const selectBomState= createSelector(
  [selectRuntime],
  (runtime) => runtime.paginatedBoms
);

/**
 * Selects the current BOM list data.
 */
export const selectBomData = createSelector(
  [selectBomState],
  (boms) => boms.data
);

/**
 * Selects the current pagination metadata.
 */
export const selectBomPagination = createSelector(
  [selectBomState],
  (boms) => boms.pagination
);

/**
 * Selects the current filter set applied to BOM queries.
 */
export const selectBomFilters = createSelector(
  [selectBomState],
  (boms) => boms.filters
);

/**
 * Selects the loading state of the BOM list.
 */
export const selectBomLoading = createSelector(
  [selectBomState],
  (boms) => boms.loading
);

/**
 * Selects the error message, if any.
 */
export const selectBomError = createSelector(
  [selectBomState],
  (boms) => boms.error
);

/**
 * Selects total record count (fallback to 0 if missing).
 */
export const selectBomTotalRecords = createSelector(
  [selectBomPagination],
  (pagination) => pagination?.totalRecords ?? 0
);

/**
 * Derived selector: whether BOM data is empty and not currently loading.
 */
export const selectIsBomListEmpty = createSelector(
  [selectBomData, selectBomLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Derived selector that determines whether there are more BOM pages
 * available for pagination.
 *
 * This is typically used in infinite scroll or paginated table views
 * to decide whether to load the next page.
 *
 * @example
 * const hasMore = useAppSelector(selectHasMoreBomPages);
 * if (hasMore) dispatch(fetchPaginatedBomsThunk({ page: nextPage }));
 *
 * @returns {boolean} `true` if more pages are available; otherwise `false`.
 */
export const selectHasMoreBomPages = createSelector(
  [selectBomPagination],
  (pagination) => !!pagination && pagination.page < pagination.totalPages
);
