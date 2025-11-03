import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectBomDetailsData,
  selectBomDetailsError,
  selectBomDetailsLoading,
  selectBomPartCount,
  selectBomTotalEstimatedCost,
  selectHasBomDetails,
} from '@features/bom/state/bomDetailsSelectors';
import { fetchBomDetailsThunk } from '@features/bom/state/bomThunks';
import { resetBomDetails } from '@features/bom/state/bomDetailsSlice';

/**
 * Custom hook for accessing and managing BOM details.
 *
 * Handles data fetching, resetting, and state selection using Redux.
 *
 * @returns An object containing BOM details state, selectors, and actions.
 *
 * @example
 * const { data, loading, error, refresh, reset } = useBomDetails(bomId);
 */
const useBomDetails = () => {
  const dispatch = useAppDispatch();

  // --- Selectors ---
  const data = useAppSelector(selectBomDetailsData);
  const loading = useAppSelector(selectBomDetailsLoading);
  const error = useAppSelector(selectBomDetailsError);
  const hasData = useAppSelector(selectHasBomDetails);
  const partCount = useAppSelector(selectBomPartCount);
  const totalEstimatedCost = useAppSelector(selectBomTotalEstimatedCost);

  // --- Actions ---
  const fetch = useCallback(
    (bomId: string | null) => {
      if (!bomId) return;
      dispatch(fetchBomDetailsThunk(bomId));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetBomDetails());
  }, [dispatch]);

  // --- Memoized derived values ---
  const summary = useMemo(() => data?.summary ?? null, [data]);

  return useMemo(
    () => ({
      data,
      summary,
      loading,
      error,
      hasData,
      partCount,
      totalEstimatedCost,
      fetch,
      reset,
    }),
    [
      data,
      summary,
      loading,
      error,
      hasData,
      partCount,
      totalEstimatedCost,
      fetch,
      reset,
    ]
  );
};

export default useBomDetails;
