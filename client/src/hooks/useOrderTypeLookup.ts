import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchOrderTypeLookupThunk,
  selectOrderTypeError,
  selectOrderTypeLoading,
  selectOrderTypeOptions,
  type OrderTypeLookupQueryParams,
} from '@features/lookup/state';
import { clearOrderTypeLookup } from '@features/lookup/state/orderTypeLookupSlice';

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

  const fetchData = useCallback(
    (params?: OrderTypeLookupQueryParams) => {
      dispatch(fetchOrderTypeLookupThunk(params));
    },
    [dispatch]
  );

  const resetData = useCallback(
    () => dispatch(clearOrderTypeLookup()),
    [dispatch]
  );

  return useMemo(
    () => ({
      options,
      loading,
      error,
      fetchData,
      resetData,
    }),
    [options, loading, error, fetchData, resetData]
  );
};

export default useOrderTypeLookup;
