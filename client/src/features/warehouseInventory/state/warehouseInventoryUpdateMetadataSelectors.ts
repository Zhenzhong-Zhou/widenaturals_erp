import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the warehouse inventory metadata update state slice.
 */
const selectWarehouseInventoryUpdateMetadataState = (state: RootState) =>
  selectRuntime(state).warehouseInventoryUpdateMetadata;

/**
 * Selects whether the metadata update request is currently loading.
 */
export const selectWarehouseInventoryUpdateMetadataLoading = createSelector(
  [selectWarehouseInventoryUpdateMetadataState],
  (metadataState) => metadataState.loading
);

/**
 * Selects any error message from the metadata update request.
 */
export const selectWarehouseInventoryUpdateMetadataError = createSelector(
  [selectWarehouseInventoryUpdateMetadataState],
  (metadataState): string | null => metadataState.error?.message ?? null
);

/**
 * Selects whether the metadata update completed successfully.
 */
export const selectWarehouseInventoryUpdateMetadataSuccess = createSelector(
  [selectWarehouseInventoryUpdateMetadataState],
  (metadataState) => !!metadataState.data
);

/**
 * Selects the normalized metadata update response.
 */
export const selectWarehouseInventoryUpdateMetadataResponse = createSelector(
  [selectWarehouseInventoryUpdateMetadataState],
  (metadataState) => ({
    message: metadataState.message ?? '',
    data: metadataState.data ?? null,
  })
);
