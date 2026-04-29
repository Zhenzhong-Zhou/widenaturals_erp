import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the warehouse inventory status update state slice.
 */
const selectWarehouseInventoryUpdateStatusState = (state: RootState) =>
  selectRuntime(state).warehouseInventoryUpdateStatus;

/**
 * Selects whether the status update request is currently loading.
 */
export const selectWarehouseInventoryUpdateStatusLoading = createSelector(
  [selectWarehouseInventoryUpdateStatusState],
  (updateState) => updateState.loading
);

/**
 * Selects any error message from the status update request.
 */
export const selectWarehouseInventoryUpdateStatusError = createSelector(
  [selectWarehouseInventoryUpdateStatusState],
  (updateState): string | null => updateState.error?.message ?? null
);

/**
 * Selects whether the status update completed successfully.
 */
export const selectWarehouseInventoryUpdateStatusSuccess = createSelector(
  [selectWarehouseInventoryUpdateStatusState],
  (updateState) => !!updateState.data
);

/**
 * Selects the normalized status update response.
 */
export const selectWarehouseInventoryUpdateStatusResponse = createSelector(
  [selectWarehouseInventoryUpdateStatusState],
  (updateState) => ({
    message: updateState.message ?? '',
    data: updateState.data ?? [],
  })
);
