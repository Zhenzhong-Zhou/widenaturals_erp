import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks.ts';
import {
  fetchWarehouseLookupThunk,
  type GetWarehouseLookupFilters,
  selectWarehouseLookupError,
  selectWarehouseLookupItems,
  selectWarehouseLookupLoading,
} from '@features/lookup/state';

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
    (filters?: GetWarehouseLookupFilters) => {
      dispatch(fetchWarehouseLookupThunk(filters));
    },
    [dispatch]
  );

  return useMemo(
    () => ({
      items,
      loading,
      error,
      fetchLookup,
    }),
    [items, loading, error, fetchLookup]
  );
};

export default useWarehouseLookup;
