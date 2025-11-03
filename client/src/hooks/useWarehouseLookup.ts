import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchWarehouseLookupThunk,
  selectWarehouseLookupError,
  selectWarehouseLookupItems,
  selectWarehouseLookupLoading,
} from '@features/lookup/state';
import { resetWarehouseLookup } from '@features/lookup/state/warehouseLookupSlice';

/**
 * Hook to access warehouse lookup state with memoization and typed store access.
 *
 */
const useWarehouseLookup = () => {
  const dispatch = useAppDispatch();

  const items = useAppSelector(selectWarehouseLookupItems);
  const loading = useAppSelector(selectWarehouseLookupLoading);
  const error = useAppSelector(selectWarehouseLookupError);

  const fetchLookup = useCallback(
    (params?: { warehouseTypeId?: string }) => {
      dispatch(fetchWarehouseLookupThunk(params));
    },
    [dispatch]
  );

  const resetLookup = useCallback(() => {
    dispatch(resetWarehouseLookup());
  }, [dispatch]);

  return useMemo(
    () => ({
      items,
      loading,
      error,
      fetchLookup,
      resetLookup,
    }),
    [items, loading, error, fetchLookup, resetLookup]
  );
};

export default useWarehouseLookup;
