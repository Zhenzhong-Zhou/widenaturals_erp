import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  getOrderDetailsByIdThunk,
  makeSelectOrderItemById,
  type OrderRouteParams,
  selectHasOrder,
  selectOrderDetailsData,
  selectOrderDetailsError,
  selectOrderDetailsLoading,
  selectOrderHeader,
  selectOrderItemCount,
  selectOrderItems,
  selectOrderTotals,
} from '@features/order/state';
import { clearOrderDetails } from '@features/order/state/orderDetailsSlice';

/**
 * useOrderDetails
 *
 * Provides memoized accessors over the order details slice and exposes
 * `fetchById` and `reset` dispatch helpers.
 *
 * Usage:
 * const {
 *   data, header, items, itemCount, loading, error, hasOrder, totals,
 *   fetchById, reset
 * } = useOrderDetails();
 */
export const useOrderDetails = () => {
  const dispatch = useAppDispatch();

  const data = useAppSelector(selectOrderDetailsData);
  const header = useAppSelector(selectOrderHeader);
  const items = useAppSelector(selectOrderItems);
  const itemCount = useAppSelector(selectOrderItemCount);
  const loading = useAppSelector(selectOrderDetailsLoading);
  const error = useAppSelector(selectOrderDetailsError);
  const hasOrder = useAppSelector(selectHasOrder);
  const totals = useAppSelector(selectOrderTotals);

  const fetchById = useCallback(
    (params: OrderRouteParams) => dispatch(getOrderDetailsByIdThunk(params)),
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(clearOrderDetails());
  }, [dispatch]);

  return {
    data,
    header,
    items,
    itemCount,
    loading,
    error,
    hasOrder,
    totals,
    fetchById,
    reset,
  };
};

/**
 * useOrderItemById
 *
 * Factory hook to subscribe to a single item from the order by its ID.
 * Keeps row-level components from re-rendering when unrelated items change.
 *
 * Usage:
 * const item = useOrderItemById(itemId);
 */
export const useOrderItemById = (itemId: string) => {
  return useAppSelector(makeSelectOrderItemById(itemId));
};
