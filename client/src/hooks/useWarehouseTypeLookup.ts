import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchWarehouseTypeLookupThunk,
  selectWarehouseTypeLookupOptions,
  selectWarehouseTypeLookupError,
  selectWarehouseTypeLookupLoading,
  selectWarehouseTypeLookupMeta,
} from '@features/lookup/state';
import type { WarehouseTypeLookupParams } from '@features/lookup/state';
import { resetWarehouseTypeLookup } from '@features/lookup/state/warehouseTypeLookupSlice';

/**
 * Hook for accessing Warehouse Type lookup state and actions.
 */
const useWarehouseTypeLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectWarehouseTypeLookupOptions);
  const loading = useAppSelector(selectWarehouseTypeLookupLoading);
  const error = useAppSelector(selectWarehouseTypeLookupError);
  const meta = useAppSelector(selectWarehouseTypeLookupMeta);

  const fetch = useCallback(
    (params?: WarehouseTypeLookupParams) => {
      dispatch(fetchWarehouseTypeLookupThunk(params));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetWarehouseTypeLookup());
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

export default useWarehouseTypeLookup;
