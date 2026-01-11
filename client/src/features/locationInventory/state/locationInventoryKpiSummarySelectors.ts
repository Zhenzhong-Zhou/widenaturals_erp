import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';
import type { LocationInventoryKpiSummaryItem } from '@features/locationInventory/state/locationInventoryTypes';

/**
 * Root selector to access the KPI summary state slice.
 */
const selectKpiSummaryState= createSelector(
  [selectRuntime],
  (runtime) => runtime.locationInventoryKpiSummary
);

/**
 * Selector to retrieve all KPI summary rows.
 */
export const selectKpiSummaryData = createSelector(
  [selectKpiSummaryState],
  (state) => state.data
);

/**
 * Selector to retrieve loading status of KPI summary fetch.
 */
export const selectKpiSummaryLoading = createSelector(
  [selectKpiSummaryState],
  (state) => state.loading
);

/**
 * Selector to retrieve an error message from KPI summary fetch, if any.
 */
export const selectKpiSummaryError = createSelector(
  [selectKpiSummaryState],
  (state) => state.error
);

/**
 * Selector to retrieve the total KPI summary row (batchType = 'total').
 */
export const selectKpiSummaryTotalRow = createSelector(
  [selectKpiSummaryData],
  (data) =>
    data.find(
      (item: LocationInventoryKpiSummaryItem) => item.batchType === 'total'
    )
);

/**
 * Selector to retrieve the product KPI summary row (batchType = 'product').
 */
export const selectKpiSummaryProductRow = createSelector(
  [selectKpiSummaryData],
  (data) =>
    data.find(
      (item: LocationInventoryKpiSummaryItem) => item.batchType === 'product'
    )
);

/**
 * Selector to retrieve the packaging material KPI summary row (batchType = 'packaging_material').
 */
export const selectKpiSummaryMaterialRow = createSelector(
  [selectKpiSummaryData],
  (data) =>
    data.find(
      (item: LocationInventoryKpiSummaryItem) =>
        item.batchType === 'packaging_material'
    )
);
