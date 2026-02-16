import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchSupplierLookupThunk,
  selectSupplierLookupOptions,
  selectSupplierLookupError,
  selectSupplierLookupLoading,
  selectSupplierLookupMeta,
} from '@features/lookup/state';
import type { SupplierLookupParams } from '@features/lookup/state';
import { resetSupplierLookup } from '@features/lookup/state/supplierLookupSlice';

/**
 * Hook for accessing Supplier lookup state and actions.
 */
const useSupplierLookup = () => {
  const dispatch = useAppDispatch();
  
  const options = useAppSelector(selectSupplierLookupOptions);
  const loading = useAppSelector(selectSupplierLookupLoading);
  const error = useAppSelector(selectSupplierLookupError);
  const meta = useAppSelector(selectSupplierLookupMeta);
  
  const fetch = useCallback(
    (params?: SupplierLookupParams) => {
      dispatch(fetchSupplierLookupThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetSupplierLookup());
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

export default useSupplierLookup;
