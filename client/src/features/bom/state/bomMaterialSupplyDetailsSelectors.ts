import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the BOM Material Supply Details state slice.
 *
 * Responsibilities:
 * - Extract the BOM material supply details slice from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - No memoization or transformation
 */
const selectBomMaterialSupplyDetailsState = (state: RootState) =>
  selectRuntime(state).bomMaterialSupplyDetails;

/**
 * Selects the full BOM material supply data payload.
 *
 * Includes:
 * - summary
 * - detailed BOM material supply items
 */
export const selectBomMaterialSupplyData = createSelector(
  [selectBomMaterialSupplyDetailsState],
  (state) => state.data
);

/**
 * Selects whether the BOM material supply details request is currently loading.
 */
export const selectBomMaterialSupplyLoading = createSelector(
  [selectBomMaterialSupplyDetailsState],
  (state) => state.loading
);

/**
 * Selects any error message from the BOM material supply details slice.
 */
export const selectBomMaterialSupplyError = createSelector(
  [selectBomMaterialSupplyDetailsState],
  (state) => state.error
);

/**
 * Selects the currently selected BOM ID associated with the material supply view.
 */
export const selectSelectedBomId = createSelector(
  [selectBomMaterialSupplyDetailsState],
  (state) => state.selectedBomId
);

/**
 * Selects the summary section of the BOM material supply details.
 *
 * Includes cost totals, supplier aggregation, and part-level breakdowns.
 */
export const selectBomMaterialSupplySummary = createSelector(
  [selectBomMaterialSupplyData],
  (data) => data?.data.summary ?? null
);

/**
 * Selects the detailed list of BOM material supply items.
 *
 * Includes part, material, supplier, and batch information.
 */
export const selectBomMaterialSupplyDetails = createSelector(
  [selectBomMaterialSupplyData],
  (data) => data?.data.details ?? []
);

/**
 * Returns true if the BOM material supply response contains
 * at least one detailed BOM item.
 *
 * Useful for conditional UI rendering (e.g., empty states).
 */
export const selectHasBomMaterialSupplyData = createSelector(
  [selectBomMaterialSupplyData],
  (data) => Boolean(data?.data.details?.length)
);

/**
 * Selects a summarized cost overview derived from the BOM material supply summary.
 *
 * Returns:
 * - totalEstimated
 * - totalActual
 * - variance
 * - variancePercentage
 */
export const selectBomMaterialSupplyCostOverview = createSelector(
  [selectBomMaterialSupplySummary],
  (summary) =>
    summary
      ? {
          totalEstimated: summary.totals.totalEstimatedCost,
          totalActual: summary.totals.totalActualCost,
          variance: summary.totals.variance,
          variancePercentage: summary.totals.variancePercentage,
        }
      : null
);
