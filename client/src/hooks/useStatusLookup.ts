import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchStatusLookupThunk,
  selectStatusLookupOptions,
  selectStatusLookupError,
  selectStatusLookupLoading,
  selectStatusLookupMeta,
} from '@features/lookup/state';
import type {
  StatusLookupParams,
} from '@features/lookup/state';
import { resetStatusLookup } from '@features/lookup/state/statusLookupSlice';

/**
 * Hook for accessing Status lookup state and actions.
 *
 * Provides memoized dropdown options, loading, error, pagination metadata,
 * and fetch/reset helpers.
 */
const useStatusLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectStatusLookupOptions);
  const loading = useAppSelector(selectStatusLookupLoading);
  const error = useAppSelector(selectStatusLookupError);
  const meta = useAppSelector(selectStatusLookupMeta);

  const fetch = useCallback(
    (params?: StatusLookupParams) => {
      dispatch(fetchStatusLookupThunk(params));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetStatusLookup());
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

export default useStatusLookup;
