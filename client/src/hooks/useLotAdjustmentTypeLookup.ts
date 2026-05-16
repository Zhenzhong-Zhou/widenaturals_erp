import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchLotAdjustmentTypeLookupThunk,
  selectLotAdjustmentTypeLookupOptions,
  selectLotAdjustmentTypeLookupError,
  selectLotAdjustmentTypeLookupLoading,
  selectLotAdjustmentTypeLookupMeta,
} from '@features/lookup/state';
import type { LotAdjustmentTypeLookupParams } from '@features/lookup/state';
import { resetLotAdjustmentTypeLookup } from '@features/lookup/state/lotAdjustmentTypeLookupSlice';

/**
 * Hook for accessing lot adjustment type lookup state and actions.
 */
const useLotAdjustmentTypeLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectLotAdjustmentTypeLookupOptions);
  const loading = useAppSelector(selectLotAdjustmentTypeLookupLoading);
  const error = useAppSelector(selectLotAdjustmentTypeLookupError);
  const meta = useAppSelector(selectLotAdjustmentTypeLookupMeta);

  const fetch = useCallback(
    (params?: LotAdjustmentTypeLookupParams) => {
      dispatch(fetchLotAdjustmentTypeLookupThunk(params));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetLotAdjustmentTypeLookup());
  }, [dispatch]);

  return useMemo(
    () => ({
      options,
      loading,
      error,
      meta,
      fetch,
      reset,
    }),
    [options, loading, error, meta, fetch, reset]
  );
};

export default useLotAdjustmentTypeLookup;
