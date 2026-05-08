import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchInventoryStatusLookupThunk,
  selectInventoryStatusLookupOptions,
  selectInventoryStatusLookupError,
  selectInventoryStatusLookupLoading,
  selectInventoryStatusLookupMeta,
} from '@features/lookup/state';
import type { InventoryStatusLookupParams } from '@features/lookup/state';
import { resetInventoryStatusLookup } from '@features/lookup/state/inventoryStatusLookupSlice';

/**
 * Hook for accessing Inventory Status lookup state and actions.
 */
const useInventoryStatusLookup = () => {
  const dispatch = useAppDispatch();
  
  const options = useAppSelector(selectInventoryStatusLookupOptions);
  const loading = useAppSelector(selectInventoryStatusLookupLoading);
  const error = useAppSelector(selectInventoryStatusLookupError);
  const meta = useAppSelector(selectInventoryStatusLookupMeta);
  
  const fetch = useCallback(
    (params?: InventoryStatusLookupParams) => {
      dispatch(fetchInventoryStatusLookupThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetInventoryStatusLookup());
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

export default useInventoryStatusLookup;
