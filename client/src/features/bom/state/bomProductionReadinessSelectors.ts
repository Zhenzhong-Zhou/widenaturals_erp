import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { BomReadinessPart } from '@features/bom/state/bomTypes';

/** Base selector for the BOM Production Readiness slice */
export const selectBomProductionReadinessState = (state: RootState) =>
  state.productionReadiness;

/** Returns the full readiness summary data object */
export const selectBomReadinessData = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.data
);

/** Returns the currently selected BOM ID */
export const selectSelectedBomId = createSelector(
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
  (data) => data?.metadata ?? null
);

/** Returns the list of all readiness parts with material batch info */
export const selectBomReadinessParts = createSelector(
  [selectBomReadinessData],
  (data) => data?.parts ?? []
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
 * Selector that returns a concise, derived summary object
 * representing key production readiness metrics for the current BOM.
 *
 * Combines `metadata` and `bottleneckCount` into a single object for
 * easier consumption by dashboards, summary cards, and overview panels.
 *
 * @returns An object containing:
 * - `isReady`: Whether the BOM is ready for production.
 * - `maxUnits`: Maximum producible units based on current inventory.
 * - `bottleneckCount`: Total number of bottleneck parts detected.
 *
 * @example
 * const summary = useSelector(selectBomReadinessSummary);
 * console.log(summary.maxUnits, summary.isReady);
 */
export const selectBomReadinessSummary = createSelector(
  [selectBomReadinessMetadata, selectBottleneckCount],
  (metadata, bottleneckCount) => ({
    isReady: metadata?.isReadyForProduction ?? false,
    maxUnits: metadata?.maxProducibleUnits ?? 0,
    bottleneckCount,
  })
);
