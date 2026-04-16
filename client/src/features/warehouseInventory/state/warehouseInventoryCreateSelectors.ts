import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { WarehouseInventoryRecord } from '@features/warehouseInventory';

/**
 * Base selector for the warehouse inventory creation state slice.
 *
 * Responsibilities:
 * - Extract the warehouse inventory creation state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - No memoization or transformation
 */
const selectWarehouseInventoryCreateState = (state: RootState) =>
  selectRuntime(state).warehouseInventoryCreate;

/**
 * Selects whether the warehouse inventory creation request is currently loading.
 */
export const selectWarehouseInventoryCreateLoading = createSelector(
  [selectWarehouseInventoryCreateState],
  (createState) => createState.loading
);

/**
 * Selects any error message from the warehouse inventory creation request.
 */
export const selectWarehouseInventoryCreateError = createSelector(
  [selectWarehouseInventoryCreateState],
  (createState): string | null => createState.error?.message ?? null
);

/**
 * Selects the normalized warehouse inventory creation response.
 *
 * Returns an object containing:
 * - success: boolean
 * - message: string
 * - data: WarehouseInventoryRecord[]
 */
export const selectWarehouseInventoryCreateResponse = createSelector(
  [selectWarehouseInventoryCreateState],
  (createState) => ({
    success: createState.success ?? false,
    message: createState.message ?? '',
    data: createState.data ?? [],
  })
);

/**
 * Selects and memoizes display labels for created inventory records.
 *
 * Each entry shows the batch type and lot number.
 * Defaults to an empty array when no records are present.
 */
export const selectCreatedInventoryLabels = createSelector(
  [selectWarehouseInventoryCreateState],
  (createState) =>
    createState.data?.map((record: WarehouseInventoryRecord) => {
      const lotNumber =
        record.productInfo?.batch?.lotNumber ??
        record.packagingInfo?.batch?.lotNumber ??
        '—';
      return `${record.batchType}: ${lotNumber}`;
    }) ?? []
);
