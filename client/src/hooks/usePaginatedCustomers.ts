import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectPaginatedCustomers,
  selectPaginatedCustomersLoading,
  selectPaginatedCustomersError,
  selectPaginatedCustomersPage,
  selectPaginatedCustomersTotalPages,
  selectPaginatedCustomersTotalRecords,
  selectPaginatedCustomersLimit,
  fetchPaginatedCustomersThunk,
} from '@features/customer/state';
import type { FetchPaginatedCustomersParams } from '@features/customer/state';

/**
 * Hook to access paginated customer data and metadata.
 * Includes customers, pagination, loading, error, and fetch dispatcher.
 */
const usePaginatedCustomers = () => {
  const dispatch = useAppDispatch();

  const customers = useAppSelector(selectPaginatedCustomers);
  const loading = useAppSelector(selectPaginatedCustomersLoading);
  const error = useAppSelector(selectPaginatedCustomersError);
  const page = useAppSelector(selectPaginatedCustomersPage);
  const limit = useAppSelector(selectPaginatedCustomersLimit);
  const totalPages = useAppSelector(selectPaginatedCustomersTotalPages);
  const totalRecords = useAppSelector(selectPaginatedCustomersTotalRecords);

  const fetchCustomers = useCallback(
    (params?: FetchPaginatedCustomersParams) => {
      dispatch(fetchPaginatedCustomersThunk(params ?? {}));
    },
    [dispatch]
  );

  return useMemo(
    () => ({
      customers,
      page,
      limit,
      totalPages,
      totalRecords,
      loading,
      error,
      fetchCustomers,
    }),
    [customers, page, limit, totalPages, totalRecords, loading, error]
  );
};

export default usePaginatedCustomers;
