import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { LocationInventoryKpiSummaryItem } from '@features/locationInventory/state/locationInventoryTypes';

/**
 * Base selector for the location inventory KPI summary state slice.
 *
 * Responsibilities:
 * - Extract the KPI summary state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - Internal implementation detail
 */
const selectKpiSummaryState = (state: RootState) =>
  selectRuntime(state).locationInventoryKpiSummary;

/**
 * Selects all KPI summary rows.
 */
export const selectKpiSummaryData = createSelector(
  [selectKpiSummaryState],
  (state) => state.data
);

/**
 * Selects whether the KPI summary request is currently loading.
 */
export const selectKpiSummaryLoading = createSelector(
  [selectKpiSummaryState],
  (state) => state.loading
);

/**
 * Selects any error message from the KPI summary request.
 */
export const selectKpiSummaryError = createSelector(
  [selectKpiSummaryState],
  (state) => state.error
);

/**
 * Selects the total KPI summary row.
 *
 * Returns `undefined` if the total row is not present.
 */
export const selectKpiSummaryTotalRow = createSelector(
  [selectKpiSummaryData],
  (data) =>
    data.find(
      (item: LocationInventoryKpiSummaryItem) =>
        item.batchType === 'total'
    )
);

/**
 * Selects the product KPI summary row.
 *
 * Returns `undefined` if the product row is not present.
 */
export const selectKpiSummaryProductRow = createSelector(
  [selectKpiSummaryData],
  (data) =>
    data.find(
      (item: LocationInventoryKpiSummaryItem) =>
        item.batchType === 'product'
    )
);

/**
 * Selects the packaging material KPI summary row.
 *
 * Returns `undefined` if the material row is not present.
 */
export const selectKpiSummaryMaterialRow = createSelector(
  [selectKpiSummaryData],
  (data) =>
    data.find(
      (item: LocationInventoryKpiSummaryItem) =>
        item.batchType === 'packaging_material'
    )
);
