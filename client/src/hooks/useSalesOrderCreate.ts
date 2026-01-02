import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  createSalesOrderThunk,
  selectCreatedSalesOrderId,
  selectSalesOrderCreationError,
  selectSalesOrderCreationLoading,
  resetSalesOrderCreation,
} from '@features/order/state';
import type { CreateSalesOrderInput } from '@features/order/state';

/**
 * Hook for managing the sales order creation lifecycle.
 *
 * Provides state selectors and a submitted handler that accepts the payload and category.
 */
const useSalesOrderCreate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const loading = useAppSelector(selectSalesOrderCreationLoading);
  const error = useAppSelector(selectSalesOrderCreationError);
  const orderId = useAppSelector(selectCreatedSalesOrderId);

  /**
   * Handles form submission logic for creating a new sales order.
   *
   * @param category - The order category (e.g., 'sales')
   * @param data - The order creation payload
   */
  const handleSubmitSalesOrder = useCallback(
    async (category: string, data: CreateSalesOrderInput) => {
      const resultAction = await dispatch(
        createSalesOrderThunk({ category, data })
      );

      if (createSalesOrderThunk.fulfilled.match(resultAction)) {
        const id = resultAction.payload.data.orderId;

        enqueueSnackbar('Sales order created successfully!', {
          variant: 'success',
        });
        navigate(`/orders/${category}/details/${id}`);
      } else {
        enqueueSnackbar('Failed to create sales order.', { variant: 'error' });
      }
    },
    [dispatch, navigate, enqueueSnackbar]
  );

  return {
    loading,
    error,
    orderId,
    handleSubmitSalesOrder,
    resetState: () => dispatch(resetSalesOrderCreation()),
  };
};

export default useSalesOrderCreate;
