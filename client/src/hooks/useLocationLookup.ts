import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchLocationLookupThunk,
  selectLocationLookupOptions,
  selectLocationLookupError,
  selectLocationLookupLoading,
  selectLocationLookupMeta,
} from '@features/lookup/state';
import type { LocationLookupParams } from '@features/lookup/state';
import { resetLocationLookup } from '@features/lookup/state/locationLookupSlice';

/**
 * Hook for accessing Location lookup state and actions.
 */
const useLocationLookup = () => {
  const dispatch = useAppDispatch();
  
  const options = useAppSelector(selectLocationLookupOptions);
  const loading = useAppSelector(selectLocationLookupLoading);
  const error = useAppSelector(selectLocationLookupError);
  const meta = useAppSelector(selectLocationLookupMeta);
  
  const fetch = useCallback(
    (params?: LocationLookupParams) => {
      dispatch(fetchLocationLookupThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetLocationLookup());
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

export default useLocationLookup;
