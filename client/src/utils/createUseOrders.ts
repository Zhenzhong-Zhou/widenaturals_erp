import { useCallback, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks.ts';
import type { FetchOrdersParams, OrdersResponse, Order } from '@features/order';
import type { AsyncThunk } from '@reduxjs/toolkit';

interface UseOrdersSelectors {
  selectOrders: (state: any) => Order[];
  selectLoading: (state: any) => boolean;
  selectError: (state: any) => string | null;
  selectPagination: (state: any) => OrdersResponse['pagination'];
  selectOrdersByStatus: (status: string) => (state: any) => Order[];
  selectOrderById: (id: string) => (state: any) => Order | undefined;
}

interface CreateUseOrdersProps {
  fetchThunk: AsyncThunk<OrdersResponse, FetchOrdersParams, any>;
  selectors: UseOrdersSelectors;
}

export const createUseOrders = ({ fetchThunk, selectors }: CreateUseOrdersProps) => {
  return () => {
    const dispatch = useAppDispatch();
    const [refreshCounter, setRefreshCounter] = useState(0);
    
    const orders = useAppSelector(selectors.selectOrders);
    const loading = useAppSelector(selectors.selectLoading);
    const error = useAppSelector(selectors.selectError);
    const pagination = useAppSelector(selectors.selectPagination);
    
    const memoizedOrders = useMemo(() => orders, [orders]);
    const memoizedLoading = useMemo(() => loading, [loading]);
    const memoizedError = useMemo(() => error, [error]);
    const memoizedPagination = useMemo(() => pagination, [pagination]);
    
    const fetchOrders = useCallback(
      (params: FetchOrdersParams) => dispatch(fetchThunk(params)),
      [dispatch]
    );
    
    const manualRefresh = useCallback(() => {
      setRefreshCounter((prev) => prev + 1);
    }, []);
    
    const getOrdersByStatus = useCallback(
      (status: string) =>
        useAppSelector((state) => selectors.selectOrdersByStatus(status)(state)),
      []
    );
    
    const getOrderById = useCallback(
      (orderId: string) =>
        useAppSelector((state) => selectors.selectOrderById(orderId)(state)),
      []
    );
    
    return {
      orders: memoizedOrders,
      loading: memoizedLoading,
      error: memoizedError,
      pagination: memoizedPagination,
      fetchOrders,
      getOrdersByStatus,
      getOrderById,
      manualRefresh,
      refreshCounter,
    };
  };
};
