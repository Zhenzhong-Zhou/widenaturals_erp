import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * selectPaginatedPackagingMaterialBatchesState
 *
 * Base selector for the paginated packaging material batch slice.
 *
 * Responsibilities:
 * - Extract the `paginatedPackagingMaterialBatches` state from runtime
 *
 * Design notes:
 * - MUST be a plain function
 * - MUST NOT use `createSelector`
 * - Prevents identity-selector warnings
 *
 * @param state Root redux state
 */
const selectPaginatedPackagingMaterialBatchesState = (state: RootState) =>
  selectRuntime(state).paginatedPackagingMaterialBatches;

/**
 * Selector: Returns the array of flattened,
 * UI-ready packaging material batch records.
 */
export const selectPaginatedPackagingMaterialBatchData = createSelector(
  [selectPaginatedPackagingMaterialBatchesState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the packaging material batch
 * request is currently loading.
 */
export const selectPaginatedPackagingMaterialBatchLoading = createSelector(
  [selectPaginatedPackagingMaterialBatchesState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the packaging
 * material batch state, if any.
 */
export const selectPaginatedPackagingMaterialBatchError = createSelector(
  [selectPaginatedPackagingMaterialBatchesState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selector: Returns pagination metadata
 * for the packaging material batch list.
 */
export const selectPaginatedPackagingMaterialBatchPagination = createSelector(
  [selectPaginatedPackagingMaterialBatchesState],
  (state) => state.pagination
);

/**
 * Selector: Returns true only if the packaging material batch
 * list has loaded and contains no records.
 */
export const selectPaginatedPackagingMaterialBatchIsEmpty = createSelector(
  [
    selectPaginatedPackagingMaterialBatchData,
    selectPaginatedPackagingMaterialBatchLoading,
  ],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selector factory: Returns a selector that resolves
 * a single packaging material batch record by ID.
 *
 * Must be used as a factory to avoid selector cache collisions
 * when multiple rows are rendered concurrently.
 */
export const makeSelectPackagingMaterialBatchById = () =>
  createSelector(
    [
      selectPaginatedPackagingMaterialBatchData,
      (_: RootState, id: string) => id,
    ],
    (records, id) => records.find((record) => record.id === id) ?? null
  );
