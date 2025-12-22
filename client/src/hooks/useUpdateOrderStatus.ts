import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectUpdatedOrderStatusData,
  selectUpdateOrderStatusError,
  selectUpdateOrderStatusLoading,
  updateOrderStatusThunk,
  resetUpdateOrderStatus,
} from '@features/order/state';
import type {
  OrderRouteParams,
} from '@features/order/state';

/**
 * Hook to access and control the update order status logic.
 *
 * Provides:
 * - Memoized state (loading, error, data, isSuccess)
 * - Dispatch functions to update or reset order status
 *
 * @returns An object with:
 *  - loading: Whether the update is in progress.
 *  - error: Error message if any.
 *  - data: The response payload if update succeeded.
 *  - isSuccess: True if the update succeeded.
 *  - update: Function to dispatch the status update.
 *  - reset: Function to reset the update state.
 */
const useUpdateOrderStatus = () => {
  const dispatch = useAppDispatch();

  const loading = useAppSelector(selectUpdateOrderStatusLoading);
  const error = useAppSelector(selectUpdateOrderStatusError);
  const data = useAppSelector(selectUpdatedOrderStatusData);

  const isSuccess = useMemo(
    () => !loading && !error && !!data,
    [loading, error, data]
  );

  /**
   * Dispatches a status update for a specific order.
   */
  const update = useCallback(
    (params: OrderRouteParams, statusCode: string) =>
      dispatch(updateOrderStatusThunk({ params, data: { statusCode } })),
    [dispatch]
  );

  /**
   * Resets the update order status state to initial.
   */
  const reset = useCallback(() => {
    dispatch(resetUpdateOrderStatus());
  }, [dispatch]);

  return useMemo(
    () => ({ loading, error, data, isSuccess, update, reset }),
    [loading, error, data, isSuccess, update, reset]
  );
};

export default useUpdateOrderStatus;
