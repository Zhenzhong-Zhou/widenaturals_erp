import { useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  fetchAllOrdersThunk,
  FetchOrdersParams,
  selectAllOrders,
  selectOrdersError,
  selectOrdersLoading,
  selectOrdersPagination,
  selectOrdersByStatus,
  selectOrderById,
} from '../features/order';

const useOrders = () => {
  const dispatch = useAppDispatch();
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Memoized Selectors
  const orders = useAppSelector(selectAllOrders);
  const loading = useAppSelector(selectOrdersLoading);
  const error = useAppSelector(selectOrdersError);
  const pagination = useAppSelector(selectOrdersPagination);
  
  // Memoized state values
  const memoizedOrders = useMemo(() => orders, [orders]);
  const memoizedLoading = useMemo(() => loading, [loading]);
  const memoizedError = useMemo(() => error, [error]);
  const memoizedPagination = useMemo(() => pagination, [pagination]);
  
  // Fetch all orders
  const fetchAllOrders = useCallback(
    (params: FetchOrdersParams) => dispatch(fetchAllOrdersThunk(params)),
    [dispatch]
  );
  
  // Manual refresh function
  const manualRefresh = useCallback(() => {
    setRefreshCounter(prev => prev + 1);  // Trigger a refresh by updating the state
  }, []);
  
  // Memoized function to get orders by status
  const getOrdersByStatus = useCallback(
    (status: string) => useAppSelector(state => selectOrdersByStatus(status)(state)),
    []
  );
  
  // Memoized function to get a specific order by ID
  const getOrderById = useCallback(
    (orderId: string) => useAppSelector(state => selectOrderById(orderId)(state)),
    []
  );
  
  return {
    orders: memoizedOrders,
    loading: memoizedLoading,
    error: memoizedError,
    pagination: memoizedPagination,
    fetchAllOrders,
    getOrdersByStatus,
    getOrderById,
    manualRefresh,
    refreshCounter  // Export the refreshCounter to trigger re-fetching if needed
  };
};

export default useOrders;
