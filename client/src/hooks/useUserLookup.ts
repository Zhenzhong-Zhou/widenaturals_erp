import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchUserLookupThunk,
  selectUserLookupOptions,
  selectUserLookupError,
  selectUserLookupLoading,
  selectUserLookupMeta,
} from '@features/lookup/state';
import type { UserLookupParams } from '@features/lookup/state';
import { resetUserLookup } from '@features/lookup/state/userLookupSlice';

/**
 * Hook for accessing User lookup state and actions.
 *
 * Provides memoized dropdown options, loading, error, pagination metadata,
 * and fetch/reset helpers.
 */
const useUserLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectUserLookupOptions);
  const loading = useAppSelector(selectUserLookupLoading);
  const error = useAppSelector(selectUserLookupError);
  const meta = useAppSelector(selectUserLookupMeta);

  const fetch = useCallback(
    (params?: UserLookupParams) => {
      dispatch(fetchUserLookupThunk(params));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetUserLookup());
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

export default useUserLookup;
