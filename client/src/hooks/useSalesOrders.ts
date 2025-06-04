import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  createSalesOrderThunk,
  type SalesOrder,
  selectCreatedSalesOrderError,
  selectCreatedSalesOrderId,
  selectCreatedSalesOrderLoading,
  selectCreatedSalesOrderSuccess,
} from '@features/order';

/**
 * Custom hook to manage sales order creation state and actions.
 * @returns {{
 *   loading: boolean;
 *   success: boolean;
 *   salesOrderId: string | null;
 *   error: string | null;
 *   createOrder: (orderTypeId: string, orderData: SalesOrder) => void;
 * }}
 */
const useSalesOrders = (): {
  loading: boolean;
  success: boolean;
  salesOrderId: string | null;
  error: string | null;
  createOrder: (orderTypeId: string, orderData: SalesOrder) => void;
} => {
  const dispatch = useAppDispatch();

  // Selectors for sales order state
  const loading = useAppSelector(selectCreatedSalesOrderLoading);
  const success = useAppSelector(selectCreatedSalesOrderSuccess);
  const salesOrderId = useAppSelector(selectCreatedSalesOrderId);
  const error = useAppSelector(selectCreatedSalesOrderError);

  // Dispatch function to create a sales order
  const createOrder = useCallback(
    (orderTypeId: string, orderData: SalesOrder) => {
      dispatch(createSalesOrderThunk({ orderTypeId, orderData }));
    },
    [dispatch]
  );

  // Memoize the returned object to prevent unnecessary re-renders
  return useMemo(
    () => ({ loading, success, salesOrderId, error, createOrder }),
    [loading, success, salesOrderId, error, createOrder]
  );
};

export default useSalesOrders;
