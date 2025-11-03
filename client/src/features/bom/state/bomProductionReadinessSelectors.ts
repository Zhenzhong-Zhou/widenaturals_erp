import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type {
  BomReadinessPart,
  BomReadinessSummary
} from '@features/bom/state/bomTypes';

/** Base selector for the BOM Production Readiness slice */
export const selectBomProductionReadinessState = (state: RootState) =>
  state.bomProductionReadiness;

/** Returns the full readiness summary data object */
export const selectBomReadinessData = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.data
);

/** Returns the currently selected BOM ID */
export const selectReadinessSelectedBomId = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.selectedBomId
);

/** Returns true if the slice is currently loading */
export const selectBomReadinessLoading = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.loading
);

/** Returns any error message from the latest fetch attempt */
export const selectBomReadinessError = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.error
);

/**
 * Selector that determines whether BOM Production Readiness data
 * has been successfully fetched and is ready for use.
 *
 * Evaluates based on three slice states:
 * - `data`: Must be non-null
 * - `loading`: Must be false
 * - `error`: Must be null or undefined
 *
 * @returns `true` if readiness data is fully available and not in a loading or error state.
 *
 * @example
 * const hasData = useSelector(selectBomReadinessHasData);
 * if (!hasData) return <EmptyState message="No readiness summary available" />;
 */
export const selectBomReadinessHasData = createSelector(
  [selectBomReadinessData, selectBomReadinessLoading, selectBomReadinessError],
  (data, loading, error) => !!data && !loading && !error
);

/** Returns the readiness metadata summary (overall info like producibility, bottlenecks, etc.) */
export const selectBomReadinessMetadata = createSelector(
  [selectBomReadinessData],
  (data) => data?.data?.metadata ?? null
);

/** Returns the list of all readiness parts with material batch info */
export const selectBomReadinessParts = createSelector(
  [selectBomReadinessData],
  (data) => data?.data?.parts ?? []
);

/** Returns true if the current BOM is ready for production */
export const selectIsReadyForProduction = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.isReadyForProduction
);

/** Returns the total number of bottleneck parts */
export const selectBottleneckCount = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.bottleneckCount
);

/** Returns only the parts flagged as bottlenecks */
export const selectBottleneckParts = createSelector(
  [selectBomReadinessParts],
  (parts: BomReadinessPart[]) => parts.filter((p) => p.isBottleneck)
);

/** Returns the aggregate stock health info (usable/inactive totals) */
export const selectStockHealth = createSelector(
  [selectBomReadinessMetadata],
  (metadata) => metadata?.stockHealth ?? { usable: 0, inactive: 0 }
);

/** Returns the maximum producible units for this BOM */
export const selectMaxProducibleUnits = createSelector(
  [selectBomReadinessMetadata],
  (metadata) => metadata?.maxProducibleUnits ?? 0
);

/**
 * Selector that derives a concise, high-level summary of
 * production readiness metrics for the currently selected BOM.
 *
 * It combines the normalized `metadata` and `bottleneckCount`
 * into a single, lightweight object suitable for use in
 * dashboards, summary chips, and overview panels.
 *
 * @returns {BomReadinessSummary} Object containing key readiness indicators:
 * - `isReady`: Whether the BOM is ready to start production.
 * - `maxUnits`: Maximum producible finished units based on current stock.
 * - `bottleneckCount`: Total number of bottleneck parts constraining production.
 *
 * @example
 * const summary = useSelector(selectBomReadinessSummary);
 * console.log(summary.isReady, summary.maxUnits, summary.bottleneckCount);
 */
export const selectBomReadinessSummary = createSelector(
  [selectBomReadinessMetadata, selectBottleneckCount],
  (metadata, bottleneckCount): BomReadinessSummary => ({
    isReady: metadata?.isReadyForProduction ?? false,
    maxUnits: metadata?.maxProducibleUnits ?? 0,
    bottleneckCount,
  })
);
