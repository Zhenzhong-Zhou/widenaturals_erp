import { useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchSalesOrderDetailsThunk,
  selectSalesOrderDetailsData,
  selectSalesOrderDetailsError,
  selectSalesOrderDetailsLoading,
} from '@features/order';

/**
 * useSalesOrderDetails - A custom hook to fetch and select sales order details.
 * @param orderId - The ID of the sales order to fetch.
 * @returns - { data, loading, error, isOrderFetched, refresh }
 */
const useSalesOrderDetails = (orderId: string) => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectSalesOrderDetailsData);
  const loading = useAppSelector(selectSalesOrderDetailsLoading);
  const error = useAppSelector(selectSalesOrderDetailsError);
  
  // Fetch order details when orderId changes
  useEffect(() => {
    if (orderId) {
      dispatch(fetchSalesOrderDetailsThunk(orderId));
    }
  }, [dispatch, orderId]);
  
  // Memoize the order fetched status for performance optimization
  const isOrderFetched = useMemo(() => !!data && !loading && !error, [data, loading, error]);
  
  // Refresh function to re-fetch order details
  const refresh = useCallback(() => {
    if (orderId) {
      dispatch(fetchSalesOrderDetailsThunk(orderId));
    }
  }, [dispatch, orderId]);
  
  return { data, loading, error, isOrderFetched, refresh };
};

export default useSalesOrderDetails;
