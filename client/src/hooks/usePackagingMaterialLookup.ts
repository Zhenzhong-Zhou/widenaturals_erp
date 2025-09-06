import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type PackagingMaterialLookupQueryParams,
  fetchPackagingMaterialLookupThunk,
  selectPackagingMaterialLookupOptions,
  selectPackagingMaterialLookupError,
  selectPackagingMaterialLookupLoading,
  selectPackagingMaterialLookupMeta,
} from '@features/lookup/state';
import {
  resetPackagingMaterialLookup
} from '@features/lookup/state/packagingMaterialLookupSlice';

/**
 * Hook for accessing packaging-material lookup state and actions.
 *
 * Provides memoized access to dropdown options, loading, error, and pagination metadata.
 * Also returns `fetch` and `reset` helpers.
 *
 * Usage:
 *   const { options, loading, fetch, reset } = usePackagingMaterialLookup();
 *   useEffect(() => { fetch({ keyword: 'box', options: { labelOnly: true } }); }, []);
 */
const usePackagingMaterialLookup = () => {
  const dispatch = useAppDispatch();
  
  const options = useAppSelector(selectPackagingMaterialLookupOptions);
  const loading = useAppSelector(selectPackagingMaterialLookupLoading);
  const error = useAppSelector(selectPackagingMaterialLookupError);
  const meta = useAppSelector(selectPackagingMaterialLookupMeta);
  
  const fetch = useCallback(
    (params?: PackagingMaterialLookupQueryParams) => {
      dispatch(fetchPackagingMaterialLookupThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetPackagingMaterialLookup());
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

export default usePackagingMaterialLookup;
