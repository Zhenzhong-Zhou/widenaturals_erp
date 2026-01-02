import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPaginatedAddressesThunk,
  selectPaginatedAddresses,
  selectPaginateError,
  selectPaginateLoading,
  selectPaginationMeta,
  resetPaginatedAddresses,
} from '@features/address/state';
import type { AddressQueryParams } from '@features/address/state';

/**
 * React hook for accessing and controlling paginated addresses state.
 *
 * Provides data, loading state, error, pagination metadata,
 * and dispatch helpers for fetching and resetting.
 */
const usePaginateAddresses = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const data = useAppSelector(selectPaginatedAddresses);
  const pagination = useAppSelector(selectPaginationMeta);
  const loading = useAppSelector(selectPaginateLoading);
  const error = useAppSelector(selectPaginateError);

  // Dispatch fetch thunk with query parameters
  const fetchAddresses = useCallback(
    (queryParams?: AddressQueryParams) => {
      dispatch(fetchPaginatedAddressesThunk(queryParams));
    },
    [dispatch]
  );

  // Dispatch reset action
  const resetAddresses = useCallback(() => {
    dispatch(resetPaginatedAddresses());
  }, [dispatch]);

  return {
    /** List of address items in current pagination */
    data,
    /** Pagination metadata (page, limit, totalRecords, totalPages) */
    pagination,
    /** Is data loading */
    loading,
    /** Error message if fetch failed */
    error,
    /** Fetch addresses with query parameters */
    fetchAddresses,
    /** Reset address list state */
    resetAddresses,
  };
};

export default usePaginateAddresses;
