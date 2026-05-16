import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchInventoryActionTypeLookupThunk,
  selectInventoryActionTypeLookupOptions,
  selectInventoryActionTypeLookupError,
  selectInventoryActionTypeLookupLoading,
  selectInventoryActionTypeLookupMeta,
} from '@features/lookup/state';
import type { InventoryActionTypeLookupParams } from '@features/lookup/state';
import { resetInventoryActionTypeLookup } from '@features/lookup/state/inventoryActionTypeLookupSlice';

/**
 * Hook for accessing inventory action type lookup state and actions.
 */
const useInventoryActionTypeLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectInventoryActionTypeLookupOptions);
  const loading = useAppSelector(selectInventoryActionTypeLookupLoading);
  const error = useAppSelector(selectInventoryActionTypeLookupError);
  const meta = useAppSelector(selectInventoryActionTypeLookupMeta);

  const fetch = useCallback(
    (params?: InventoryActionTypeLookupParams) => {
      dispatch(fetchInventoryActionTypeLookupThunk(params));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetInventoryActionTypeLookup());
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

export default useInventoryActionTypeLookup;
