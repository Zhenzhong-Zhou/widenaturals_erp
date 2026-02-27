import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the SKU image update slice.
 *
 * @param state - The Redux root state.
 * @returns The skuImageUpdate slice of state.
 */
const selectSkuImageUpdateState = (state: RootState) =>
  selectRuntime(state).skuImageUpdate;

/**
 * Whether the SKU image update request is currently loading.
 */
export const selectSkuImageUpdateLoading = createSelector(
  selectSkuImageUpdateState,
  (state) => state.loading
);

/**
 * Error message from the update operation, if any.
 */
export const selectSkuImageUpdateError = createSelector(
  selectSkuImageUpdateState,
  (state) => state.error
);

/**
 * The full BulkSkuImageUpdateResponse returned by the API.
 */
export const selectSkuImageUpdateData = createSelector(
  selectSkuImageUpdateState,
  (state) => state.data
);

/**
 * Batch processing statistics (succeeded, failed, duration, etc.)
 * returned by the API.
 */
export const selectSkuImageUpdateStats = createSelector(
  selectSkuImageUpdateState,
  (state) => state.stats
);

/**
 * Per-SKU update results array.
 */
export const selectSkuImageUpdateResults = createSelector(
  selectSkuImageUpdateState,
  (state) => state.results
);

/**
 * Number of successfully processed items in the batch.
 *
 * Falls back to 0 if no stats exist yet.
 */
export const selectSkuImageUpdateSucceededCount = createSelector(
  [selectSkuImageUpdateStats],
  (stats) => stats?.successCount ?? 0
);

/**
 * Number of failed items in the batch.
 *
 * Falls back to 0 if no stats exist yet.
 */
export const selectSkuImageUpdateFailedCount = createSelector(
  [selectSkuImageUpdateStats],
  (stats) => stats?.failureCount ?? 0
);

/**
 * Whether the update has produced any results.
 *
 * Useful for conditionally showing summary UI or results table.
 */
export const selectSkuImageUpdateHasResults = createSelector(
  selectSkuImageUpdateResults,
  (results) => Array.isArray(results) && results.length > 0
);

/**
 * Selector: returns a boolean indicating whether the SKU image update
 * request completed successfully.
 *
 * A non-null `data` value implies the request was successful and
 * the backend returned a valid response object.
 *
 * @returns {boolean} `true` if update data exists, otherwise `false`.
 */
export const selectSkuImageUpdateSuccess = createSelector(
  [selectSkuImageUpdateData],
  (data) => !!data
);
