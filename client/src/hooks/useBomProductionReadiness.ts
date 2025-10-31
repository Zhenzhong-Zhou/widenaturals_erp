import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchBomProductionSummaryThunk,
} from '@features/bom/state/bomThunks';
import {
  resetBomProductionReadiness,
} from '@features/bom/state/bomProductionReadinessSlice';
import {
  selectBomReadinessData,
  selectBomReadinessMetadata,
  selectBomReadinessParts,
  selectBomReadinessSummary,
  selectBomReadinessLoading,
  selectBomReadinessError,
  selectBomReadinessHasData,
  selectIsReadyForProduction,
  selectBottleneckParts,
  selectStockHealth,
  selectSelectedBomId,
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
  const data = useAppSelector(selectBomReadinessData);
  const metadata = useAppSelector(selectBomReadinessMetadata);
  const parts = useAppSelector(selectBomReadinessParts);
  const summary = useAppSelector(selectBomReadinessSummary);
  const bottlenecks = useAppSelector(selectBottleneckParts);
  const stockHealth = useAppSelector(selectStockHealth);
  const isReadyForProduction = useAppSelector(selectIsReadyForProduction);
  const selectedBomId = useAppSelector(selectSelectedBomId);
  const loading = useAppSelector(selectBomReadinessLoading);
  const error = useAppSelector(selectBomReadinessError);
  const hasData = useAppSelector(selectBomReadinessHasData);
  
  // --- Actions ---
  const fetchReadiness = useCallback(
    async (bomId: string) => {
      if (!bomId) return;
      await dispatch(fetchBomProductionSummaryThunk(bomId));
    },
    [dispatch]
  );
  
  const resetReadiness = useCallback(() => {
    dispatch(resetBomProductionReadiness());
  }, [dispatch]);
  
  // --- Derived Memoized Object ---
  const readiness = useMemo(
    () => ({
      data,
      metadata,
      parts,
      summary,
      bottlenecks,
      stockHealth,
      isReadyForProduction,
      hasData,
      loading,
      error,
      selectedBomId,
    }),
    [
      data,
      metadata,
      parts,
      summary,
      bottlenecks,
      stockHealth,
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
