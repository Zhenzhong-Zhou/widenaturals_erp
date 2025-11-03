import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import { fetchBomMaterialSupplyDetailsThunk } from '@features/bom/state/bomThunks';
import {
  resetBomMaterialSupplyDetails,
  setSelectedBomId,
} from '@features/bom/state/bomMaterialSupplyDetailsSlice';
import {
  selectBomMaterialSupplyLoading,
  selectBomMaterialSupplyError,
  selectBomMaterialSupplySummary,
  selectBomMaterialSupplyDetails,
  selectHasBomMaterialSupplyData,
  selectBomMaterialSupplyCostOverview,
  selectSelectedBomId,
} from '@features/bom/state/bomMaterialSupplyDetailsSelectors';

/**
 * Custom hook for accessing and managing BOM Material Supply Details state.
 *
 * Provides typed access to all relevant selectors, along with
 * convenient callbacks for fetching and resetting data.
 *
 * Notes:
 * - Uses `useAppSelector` for typed Redux state access.
 * - Memoizes derived values and callbacks to prevent unnecessary re-renders.
 * - Should be used in any component displaying BOM supply or cost data.
 *
 * @example
 * const {
 *   loading,
 *   error,
 *   summary,
 *   details,
 *   hasData,
 *   costOverview,
 *   fetchDetails,
 *   resetDetails,
 * } = useBomMaterialSupplyDetails();
 *
 * useEffect(() => {
 *   fetchDetails(bomId);
 * }, [bomId]);
 */
const useBomMaterialSupplyDetails = () => {
  const dispatch = useAppDispatch();

  const loading = useAppSelector(selectBomMaterialSupplyLoading);
  const error = useAppSelector(selectBomMaterialSupplyError);
  const summary = useAppSelector(selectBomMaterialSupplySummary);
  const details = useAppSelector(selectBomMaterialSupplyDetails);
  const hasData = useAppSelector(selectHasBomMaterialSupplyData);
  const costOverview = useAppSelector(selectBomMaterialSupplyCostOverview);
  const selectedBomId = useAppSelector(selectSelectedBomId);

  const fetchDetails = useCallback(
    (bomId: string) => {
      dispatch(setSelectedBomId(bomId));
      dispatch(fetchBomMaterialSupplyDetailsThunk(bomId));
    },
    [dispatch]
  );

  const resetDetails = useCallback(() => {
    dispatch(resetBomMaterialSupplyDetails());
  }, [dispatch]);

  return useMemo(
    () => ({
      loading,
      error,
      summary,
      details,
      hasData,
      costOverview,
      selectedBomId,
      fetchDetails,
      resetDetails,
    }),
    [
      loading,
      error,
      summary,
      details,
      hasData,
      costOverview,
      selectedBomId,
      fetchDetails,
      resetDetails,
    ]
  );
};

export default useBomMaterialSupplyDetails;
