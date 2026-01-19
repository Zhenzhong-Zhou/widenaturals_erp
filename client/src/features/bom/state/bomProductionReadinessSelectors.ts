import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type {
  BomReadinessPart,
  BomReadinessSummary,
} from '@features/bom/state/bomTypes';

/**
 * Base selector for the BOM Production Readiness state slice.
 *
 * Responsibilities:
 * - Extract the BOM production readiness state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - No memoization or transformation
 */
const selectBomProductionReadinessState = (state: RootState) =>
  selectRuntime(state).bomProductionReadiness;

/**
 * Selects the full production readiness response payload.
 */
export const selectBomReadinessData = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.data
);

/**
 * Selects the currently selected BOM ID for production readiness.
 */
export const selectReadinessSelectedBomId = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.selectedBomId
);

/**
 * Selects whether the production readiness request is currently loading.
 */
export const selectBomReadinessLoading = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.loading
);

/**
 * Selects any error message from the latest production readiness fetch.
 */
export const selectBomReadinessError = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.error
);

/**
 * Returns true when production readiness data has been
 * successfully fetched and is ready for use.
 */
export const selectBomReadinessHasData = createSelector(
  [selectBomReadinessData, selectBomReadinessLoading, selectBomReadinessError],
  (data, loading, error) => Boolean(data) && !loading && !error
);

/**
 * Selects high-level production readiness metadata.
 *
 * Includes producibility flags and aggregate readiness indicators.
 */
export const selectBomReadinessMetadata = createSelector(
  [selectBomReadinessData],
  (data) => data?.data?.metadata ?? null
);

/**
 * Selects the list of BOM parts evaluated for production readiness.
 *
 * Includes material, batch, and availability information.
 */
export const selectBomReadinessParts = createSelector(
  [selectBomReadinessData],
  (data) => data?.data?.parts ?? []
);

/**
 * Selects whether the currently selected BOM is ready for production.
 */
export const selectIsReadyForProduction = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.isReadyForProduction
);

/**
 * Selects the total number of bottleneck parts constraining production.
 */
export const selectBottleneckCount = createSelector(
  [selectBomProductionReadinessState],
  (state) => state.bottleneckCount
);

/**
 * Selects only the BOM parts flagged as production bottlenecks.
 */
export const selectBottleneckParts = createSelector(
  [selectBomReadinessParts],
  (parts: BomReadinessPart[]) => parts.filter((p) => p.isBottleneck)
);

/**
 * Selects aggregate stock health information for production readiness.
 *
 * Includes usable and inactive stock totals.
 */
export const selectStockHealth = createSelector(
  [selectBomReadinessMetadata],
  (metadata) => metadata?.stockHealth ?? { usable: 0, inactive: 0 }
);

/**
 * Selects the maximum number of producible finished units for the BOM.
 */
export const selectMaxProducibleUnits = createSelector(
  [selectBomReadinessMetadata],
  (metadata) => metadata?.maxProducibleUnits ?? 0
);

/**
 * Selects a concise, high-level production readiness summary.
 *
 * Combines readiness metadata and bottleneck counts into a
 * lightweight object suitable for dashboards and overview panels.
 */
export const selectBomReadinessSummary = createSelector(
  [selectBomReadinessMetadata, selectBottleneckCount],
  (metadata, bottleneckCount): BomReadinessSummary => ({
    isReady: metadata?.isReadyForProduction ?? false,
    maxUnits: metadata?.maxProducibleUnits ?? 0,
    bottleneckCount,
  })
);
