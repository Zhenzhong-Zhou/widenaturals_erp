import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchRoleLookupThunk,
  selectRoleLookupOptions,
  selectRoleLookupError,
  selectRoleLookupLoading,
  selectRoleLookupMeta,
} from '@features/lookup/state';
import type { RoleLookupParams } from '@features/lookup/state';
import { resetRoleLookup } from '@features/lookup/state/roleLookupSlice';

/**
 * Hook for accessing Role lookup state and actions.
 *
 * Provides memoized dropdown options, loading, error, pagination metadata,
 * and fetch/reset helpers.
 *
 * Intended for:
 * - Role assignment dropdowns
 * - Admin configuration UIs
 * - Permission-aware selectors
 */
const useRoleLookup = () => {
  const dispatch = useAppDispatch();
  
  const options = useAppSelector(selectRoleLookupOptions);
  const loading = useAppSelector(selectRoleLookupLoading);
  const error = useAppSelector(selectRoleLookupError);
  const meta = useAppSelector(selectRoleLookupMeta);
  
  const fetch = useCallback(
    (params?: RoleLookupParams) => {
      dispatch(fetchRoleLookupThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetRoleLookup());
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

export default useRoleLookup;
