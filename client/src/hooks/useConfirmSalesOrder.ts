import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  confirmSalesOrderThunk,
  selectConfirmOrderData,
  selectConfirmOrderError,
  selectConfirmOrderLoading,
  selectConfirmOrderSuccessMessage,
} from '@features/order';

/**
 * Custom hook to handle confirming a sales order with related state and dispatcher.
 */
const useConfirmSalesOrder = () => {
  const dispatch = useAppDispatch();

  // Memoized state from selectors
  const data = useAppSelector(selectConfirmOrderData);
  const loading = useAppSelector(selectConfirmOrderLoading);
  const error = useAppSelector(selectConfirmOrderError);
  const successMessage = useAppSelector(selectConfirmOrderSuccessMessage);

  // Memoized dispatch action
  const confirm = useCallback(
    (orderId: string) => {
      dispatch(confirmSalesOrderThunk(orderId));
    },
    [dispatch]
  );

  // Memoized return for optimization
  return useMemo(
    () => ({
      confirm,
      data,
      loading,
      error,
      successMessage,
    }),
    [confirm, data, loading, error, successMessage]
  );
};

export default useConfirmSalesOrder;
