import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

const EMPTY_ARRAY: never[] = [];

/**
 * Base selector for the warehouse inventory detail state slice.
 */
const selectWarehouseInventoryDetailState = (state: RootState) =>
  selectRuntime(state).warehouseInventoryDetail;

/**
 * Selects the full warehouse inventory detail record.
 */
export const selectWarehouseInventoryDetailData = createSelector(
  [selectWarehouseInventoryDetailState],
  (detailState) => detailState.data
);

/**
 * Selects whether the detail request is currently loading.
 */
export const selectWarehouseInventoryDetailLoading = createSelector(
  [selectWarehouseInventoryDetailState],
  (detailState) => detailState.loading
);

/**
 * Selects any error message from the detail request.
 */
export const selectWarehouseInventoryDetailError = createSelector(
  [selectWarehouseInventoryDetailState],
  (detailState): string | null => detailState.error?.message ?? null
);

/**
 * Selects the product info from the detail record, if present.
 */
export const selectWarehouseInventoryDetailProductInfo = createSelector(
  [selectWarehouseInventoryDetailData],
  (data) => data?.productInfo ?? null
);

/**
 * Selects the packaging info from the detail record, if present.
 */
export const selectWarehouseInventoryDetailPackagingInfo = createSelector(
  [selectWarehouseInventoryDetailData],
  (data) => data?.packagingInfo ?? null
);

/**
 * Selects the zone allocations from the detail record.
 */
export const selectWarehouseInventoryDetailZones = createSelector(
  [selectWarehouseInventoryDetailData],
  (data) => data?.zones ?? EMPTY_ARRAY
);

/**
 * Selects the movement history from the detail record.
 */
export const selectWarehouseInventoryDetailMovements = createSelector(
  [selectWarehouseInventoryDetailData],
  (data) => data?.movements ?? EMPTY_ARRAY
);

/**
 * Selects the audit info from the detail record.
 */
export const selectWarehouseInventoryDetailAudit = createSelector(
  [selectWarehouseInventoryDetailData],
  (data) => data?.audit ?? null
);
