import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchOrdersByCategoryThunk,
  selectOrderFilters,
  selectOrderPagination,
  selectOrdersError,
  selectOrdersLoading,
  selectPaginatedOrders,
  resetPaginatedOrders,
  setOrderListFilters,
} from '@features/order/state';
import type {
  OrderQueryParams,
} from '@features/order/state';

/**
 * Custom hook to access paginated order list state from the Redux store,
 * and expose fetch/reset helpers with proper typing and memoization.
 *
 * Provides:
 * - `orders`: Current list of orders
 * - `pagination`: Pagination metadata
 * - `filters`: Active query parameters
 * - `loading`: Fetch status
 * - `error`: Any fetch error
 * - `fetchOrders`: Callback to dispatch the order fetch thunk
 * - `resetOrders`: Callback to reset the order state
 */
const usePaginatedOrders = () => {
  const dispatch = useAppDispatch();

  const orders = useAppSelector(selectPaginatedOrders);
  const pagination = useAppSelector(selectOrderPagination);
  const filters = useAppSelector(selectOrderFilters);
  const loading = useAppSelector(selectOrdersLoading);
  const error = useAppSelector(selectOrdersError);

  /**
   * Dispatch the thunk to fetch orders for a given category and filters.
   */
  const fetchOrders = useCallback(
    (category: string, params?: OrderQueryParams) => {
      dispatch(fetchOrdersByCategoryThunk({ category, params }));
    },
    [dispatch]
  );

  /**
   * Reset order list state to initial values.
   */
  const resetOrders = useCallback(() => {
    dispatch(resetPaginatedOrders());
  }, [dispatch]);

  /**
   * Set new order filters manually (e.g., from search or filter panel).
   */
  const updateFilters = useCallback(
    (filters: OrderQueryParams) => {
      dispatch(setOrderListFilters(filters));
    },
    [dispatch]
  );

  return useMemo(
    () => ({
      orders,
      pagination,
      filters,
      loading,
      error,
      fetchOrders,
      resetOrders,
      updateFilters,
    }),
    [
      orders,
      pagination,
      filters,
      loading,
      error,
      fetchOrders,
      resetOrders,
      updateFilters,
    ]
  );
};

export default usePaginatedOrders;
