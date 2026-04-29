import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the warehouse inventory quantity adjustment state slice.
 */
const selectWarehouseInventoryAdjustQuantityState = (state: RootState) =>
  selectRuntime(state).warehouseInventoryAdjustQuantity;

/**
 * Selects whether the quantity adjustment request is currently loading.
 */
export const selectWarehouseInventoryAdjustQuantityLoading = createSelector(
  [selectWarehouseInventoryAdjustQuantityState],
  (adjustState) => adjustState.loading
);

/**
 * Selects any error message from the quantity adjustment request.
 */
export const selectWarehouseInventoryAdjustQuantityError = createSelector(
  [selectWarehouseInventoryAdjustQuantityState],
  (adjustState): string | null => adjustState.error?.message ?? null
);

/**
 * Selects whether the quantity adjustment completed successfully.
 */
export const selectWarehouseInventoryAdjustQuantitySuccess = createSelector(
  [selectWarehouseInventoryAdjustQuantityState],
  (adjustState) => !!adjustState.data
);

/**
 * Selects the normalized quantity adjustment response.
 */
export const selectWarehouseInventoryAdjustQuantityResponse = createSelector(
  [selectWarehouseInventoryAdjustQuantityState],
  (adjustState) => ({
    message: adjustState.message ?? '',
    data: adjustState.data ?? [],
  })
);
