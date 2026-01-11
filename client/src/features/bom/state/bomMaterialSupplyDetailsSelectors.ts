import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector to access the entire BOM Material Supply Details slice state.
 */
const selectBomMaterialSupplyDetailsState= createSelector(
  [selectRuntime],
  (runtime) => runtime.bomMaterialSupplyDetails
);

/**
 * Selects the full data payload (summary + details) from the slice.
 */
export const selectBomMaterialSupplyData = createSelector(
  [selectBomMaterialSupplyDetailsState],
  (state) => state.data
);

/**
 * Selects the loading status for the BOM Material Supply Details request.
 */
export const selectBomMaterialSupplyLoading = createSelector(
  [selectBomMaterialSupplyDetailsState],
  (state) => state.loading
);

/**
 * Selects the error message from the slice, if any.
 */
export const selectBomMaterialSupplyError = createSelector(
  [selectBomMaterialSupplyDetailsState],
  (state) => state.error
);

/**
 * Selects the currently selected BOM ID being viewed or fetched.
 */
export const selectSelectedBomId = createSelector(
  [selectBomMaterialSupplyDetailsState],
  (state) => state.selectedBomId
);

/**
 * Selects the summary section of the BOM Material Supply Details,
 * including total costs, suppliers, and parts breakdown.
 */
export const selectBomMaterialSupplySummary = createSelector(
  [selectBomMaterialSupplyData],
  (data) => data?.data.summary ?? null
);

/**
 * Selects the detailed list of BOM items, including
 * part, material, supplier, and batch information.
 */
export const selectBomMaterialSupplyDetails = createSelector(
  [selectBomMaterialSupplyData],
  (data) => data?.data.details ?? []
);

/**
 * Determines whether the BOM Material Supply Details slice
 * currently holds any detailed BOM item data.
 *
 * Returns `true` if the response contains a non-empty details array,
 * otherwise `false`. Useful for conditional UI rendering (e.g., showing
 * empty states or hiding tables before data is loaded).
 *
 * @example
 * const hasData = useSelector(selectHasBomMaterialSupplyData);
 * if (!hasData) return <EmptyState message="No BOM data available" />;
 */
export const selectHasBomMaterialSupplyData = createSelector(
  [selectBomMaterialSupplyData],
  (data) => !!data?.data.details?.length
);

/**
 * Computes the total estimated vs actual cost variance from the summary.
 * Returns a simplified object for quick cost overview.
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
