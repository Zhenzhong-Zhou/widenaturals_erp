import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import { fetchBomProductionSummaryThunk } from '@features/bom/state/bomThunks';
import {
  resetBomProductionReadiness,
  setSelectedBomId,
} from '@features/bom/state/bomProductionReadinessSlice';
import {
  selectBomReadinessMetadata,
  selectBomReadinessParts,
  selectBomReadinessSummary,
  selectBomReadinessLoading,
  selectBomReadinessError,
  selectBomReadinessHasData,
  selectIsReadyForProduction,
  selectBottleneckParts,
  selectStockHealth,
  selectMaxProducibleUnits,
  selectReadinessSelectedBomId,
} from '@features/bom/state/bomProductionReadinessSelectors';

/**
 * React hook for accessing and managing BOM Production Readiness Summary state.
 *
 * Provides typed access to readiness data, metadata, bottleneck info, and loading/error flags.
 * Includes pre-memoized dispatch actions for fetching and resetting readiness state.
 *
 * @example
 * const {
 *   data, metadata, summary, loading, error, fetchReadiness, resetReadiness
 * } = useBomProductionReadiness();
 *
 * useEffect(() => {
 *   fetchReadiness(bomId);
 * }, [bomId]);
 */
const useBomProductionReadiness = () => {
  const dispatch = useAppDispatch();

  // --- Selectors ---
  const metadata = useAppSelector(selectBomReadinessMetadata);
  const parts = useAppSelector(selectBomReadinessParts);
  const summary = useAppSelector(selectBomReadinessSummary);
  const bottlenecks = useAppSelector(selectBottleneckParts);
  const stockHealth = useAppSelector(selectStockHealth);
  const maxProducibleUnits = useAppSelector(selectMaxProducibleUnits);
  const isReadyForProduction = useAppSelector(selectIsReadyForProduction);
  const selectedBomId = useAppSelector(selectReadinessSelectedBomId);
  const loading = useAppSelector(selectBomReadinessLoading);
  const error = useAppSelector(selectBomReadinessError);
  const hasData = useAppSelector(selectBomReadinessHasData);

  // --- Actions ---
  const fetchReadiness = useCallback(
    (bomId: string) => {
      dispatch(setSelectedBomId(bomId));
      dispatch(fetchBomProductionSummaryThunk(bomId));
    },
    [dispatch]
  );

  const resetReadiness = useCallback(() => {
    dispatch(resetBomProductionReadiness());
  }, [dispatch]);

  // --- Derived Memoized Object ---
  const readiness = useMemo(
    () => ({
      metadata,
      parts,
      summary,
      bottlenecks,
      stockHealth,
      maxProducibleUnits,
      isReadyForProduction,
      hasData,
      loading,
      error,
      selectedBomId,
    }),
    [
      metadata,
      parts,
      summary,
      bottlenecks,
      stockHealth,
      maxProducibleUnits,
      isReadyForProduction,
      hasData,
      loading,
      error,
      selectedBomId,
    ]
  );

  return {
    ...readiness,
    fetchReadiness,
    resetReadiness,
  };
};

export default useBomProductionReadiness;
