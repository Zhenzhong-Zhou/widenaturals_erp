import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchLocationTypeLookupThunk,
  selectLocationTypeLookupOptions,
  selectLocationTypeLookupError,
  selectLocationTypeLookupLoading,
  selectLocationTypeLookupMeta,
} from '@features/lookup/state';
import type { LocationTypeLookupParams } from '@features/lookup/state';
import { resetLocationTypeLookup } from '@features/lookup/state/locationTypeLookupSlice';

/**
 * Hook for accessing Location Type lookup state and actions.
 */
const useLocationTypeLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectLocationTypeLookupOptions);
  const loading = useAppSelector(selectLocationTypeLookupLoading);
  const error = useAppSelector(selectLocationTypeLookupError);
  const meta = useAppSelector(selectLocationTypeLookupMeta);

  const fetch = useCallback(
    (params?: LocationTypeLookupParams) => {
      dispatch(fetchLocationTypeLookupThunk(params));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetLocationTypeLookup());
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

export default useLocationTypeLookup;
