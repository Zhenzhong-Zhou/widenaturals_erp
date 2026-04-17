/**
 * @file warehouseDetailSelectors.ts
 *
 * Redux selectors for the warehouse detail view.
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the warehouse detail state slice.
 */
const selectWarehouseDetailState = (state: RootState) =>
  selectRuntime(state).warehouseDetail;

/**
 * Selects the full warehouse detail record.
 */
export const selectWarehouseDetailData = createSelector(
  [selectWarehouseDetailState],
  (state) => state.data
);

/**
 * Selects whether the detail request is currently loading.
 */
export const selectWarehouseDetailLoading = createSelector(
  [selectWarehouseDetailState],
  (state) => state.loading
);

/**
 * Selects any error message from the detail request.
 */
export const selectWarehouseDetailError = createSelector(
  [selectWarehouseDetailState],
  (state): string | null => state.error?.message ?? null
);

/**
 * Selects the location block from the detail record, if present.
 */
export const selectWarehouseDetailLocation = createSelector(
  [selectWarehouseDetailData],
  (data) => data?.location ?? null
);

/**
 * Selects the inventory summary from the detail record, if present.
 */
export const selectWarehouseDetailSummary = createSelector(
  [selectWarehouseDetailData],
  (data) => data?.summary ?? null
);

/**
 * Selects the audit info from the detail record.
 */
export const selectWarehouseDetailAudit = createSelector(
  [selectWarehouseDetailData],
  (data) => data?.audit ?? null
);
