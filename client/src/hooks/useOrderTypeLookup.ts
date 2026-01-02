import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchOrderTypeLookupThunk,
  selectOrderTypeError,
  selectOrderTypeLoading,
  selectOrderTypeOptions,
} from '@features/lookup/state';
import type { OrderTypeLookupQueryParams } from '@features/lookup/state';
import { resetOrderTypeLookup } from '@features/lookup/state/orderTypeLookupSlice';

/**
 * Custom hook to fetch and access order type lookup options.
 *
 * Useful for dropdowns and filters where options can be updated dynamically.
 *
 * @returns An object containing dropdown options, loading state, error, and a fetch function.
 */
const useOrderTypeLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectOrderTypeOptions);
  const loading = useAppSelector(selectOrderTypeLoading);
  const error = useAppSelector(selectOrderTypeError);

  const fetch = useCallback(
    (params?: OrderTypeLookupQueryParams) => {
      dispatch(fetchOrderTypeLookupThunk(params));
    },
    [dispatch]
  );

  const reset = useCallback(() => dispatch(resetOrderTypeLookup()), [dispatch]);

  return useMemo(
    () => ({
      options,
      loading,
      error,
      fetch,
      reset,
    }),
    [options, loading, error, fetch, reset]
  );
};

export default useOrderTypeLookup;
