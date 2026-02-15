import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * selectPaginatedProductBatchState
 *
 * Base selector for the paginated product batch slice.
 *
 * Responsibilities:
 * - Extract the `paginatedProductBatch` state from runtime
 *
 * Design notes:
 * - MUST be a plain function
 * - MUST NOT use `createSelector`
 * - This avoids identity-selector warnings
 *
 * @param state Root redux state
 */
const selectPaginatedProductBatchesState = (state: RootState) =>
  selectRuntime(state).paginatedProductBatches;

/**
 * Selector: Returns the array of flattened, UI-ready
 * product batch records.
 */
export const selectPaginatedProductBatchData = createSelector(
  [selectPaginatedProductBatchesState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the product batch request is currently loading.
 */
export const selectPaginatedProductBatchLoading = createSelector(
  [selectPaginatedProductBatchesState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the product batch state, if any.
 */
export const selectPaginatedProductBatchError = createSelector(
  [selectPaginatedProductBatchesState],
  (state) => state.error
);

/**
 * Selector: Returns the pagination metadata for the product batch list.
 */
export const selectPaginatedProductBatchPagination = createSelector(
  [selectPaginatedProductBatchesState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` only if the product batch list is loaded and empty.
 */
export const selectPaginatedProductBatchIsEmpty = createSelector(
  [selectPaginatedProductBatchData, selectPaginatedProductBatchLoading],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selector factory: Returns a selector that resolves
 * a single product batch record by ID.
 *
 * Must be used as a factory to avoid selector cache collisions
 * when multiple rows are rendered concurrently.
 */
export const makeSelectProductBatchById = () =>
  createSelector(
    [selectPaginatedProductBatchData, (_: RootState, id: string) => id],
    (records, id) => records.find((record) => record.id === id) ?? null
  );
