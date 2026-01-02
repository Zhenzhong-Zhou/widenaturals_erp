import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';

/**
 * Base selector for the SKU image upload slice.
 *
 * @param state - The Redux root state.
 * @returns The skuImageUpload slice of state.
 */
const selectSkuImageUploadState = (state: RootState) => state.skuImageUpload;

/**
 * Whether the SKU image upload request is currently loading.
 */
export const selectSkuImageUploadLoading = createSelector(
  selectSkuImageUploadState,
  (state) => state.loading
);

/**
 * Error message from the upload operation, if any.
 */
export const selectSkuImageUploadError = createSelector(
  selectSkuImageUploadState,
  (state) => state.error
);

/**
 * The full BulkSkuImageUploadResponse returned by the API.
 */
export const selectSkuImageUploadData = createSelector(
  selectSkuImageUploadState,
  (state) => state.data
);

/**
 * Batch processing statistics (succeeded, failed, duration, etc.)
 * returned by the API.
 */
export const selectSkuImageUploadStats = createSelector(
  selectSkuImageUploadState,
  (state) => state.stats
);

/**
 * Per-SKU upload results array.
 */
export const selectSkuImageUploadResults = createSelector(
  selectSkuImageUploadState,
  (state) => state.results
);

/**
 * Number of successfully processed items in the batch.
 *
 * Falls back to 0 if no stats exist yet.
 */
export const selectSkuImageUploadSucceededCount = createSelector(
  selectSkuImageUploadStats,
  (stats) => stats?.succeeded ?? 0
);

/**
 * Number of failed items in the batch.
 *
 * Falls back to 0 if no stats exist yet.
 */
export const selectSkuImageUploadFailedCount = createSelector(
  selectSkuImageUploadStats,
  (stats) => stats?.failed ?? 0
);

/**
 * Whether the upload has produced any results.
 *
 * Useful for conditionally showing summary UI or results table.
 */
export const selectSkuImageUploadHasResults = createSelector(
  selectSkuImageUploadResults,
  (results) => Array.isArray(results) && results.length > 0
);

/**
 * Selector: returns a boolean indicating whether the SKU image upload
 * request completed successfully.
 *
 * This selector derives its value from `selectSkuImageUploadData`, which
 * holds the API response for the upload operation. A non-null `data`
 * value implies the request was successful and the backend returned
 * a valid response object.
 *
 * @returns {boolean} `true` if upload data exists, otherwise `false`.
 */
export const selectSkuImageUploadSuccess = createSelector(
  [selectSkuImageUploadData],
  (data) => !!data
);
