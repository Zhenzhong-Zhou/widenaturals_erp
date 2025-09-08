import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  confirmInventoryAllocationThunk,
  selectAllocationConfirmError,
  selectAllocationConfirmLoading,
  selectAllocationConfirmMessage,
  selectAllocationConfirmPayload
} from '@features/inventoryAllocation/state';
import { resetConfirmationState } from '@features/inventoryAllocation/state/inventoryAllocationConfirmationSlice';

/**
 * Hook to manage inventory allocation confirmation state and actions.
 *
 * Provides access to the confirmation result, loading/error states,
 * and the ability to trigger or reset the confirmation process.
 */
const useInventoryAllocationConfirmation = () => {
  const dispatch = useAppDispatch();
  
  // State selectors
  const loading = useAppSelector(selectAllocationConfirmLoading);
  const error = useAppSelector(selectAllocationConfirmError);
  const message = useAppSelector(selectAllocationConfirmMessage);
  const payload = useAppSelector(selectAllocationConfirmPayload);
  
  /**
   * Triggers the confirmation thunk for the given order ID.
   */
  const confirm = useCallback(
    (orderId: string) => {
      return dispatch(confirmInventoryAllocationThunk({ orderId }));
    },
    [dispatch]
  );
  
  /**
   * Resets the confirmation state (data, error, loading).
   */
  const reset = useCallback(() => {
    dispatch(resetConfirmationState());
  }, [dispatch]);
  
  /**
   * Memoized result object
   */
  const result = useMemo(
    () => ({
      loading,
      error,
      message,
      payload,
    }),
    [loading, error, message, payload]
  );
  
  return {
    ...result,
    confirm,
    reset,
  };
};

export default useInventoryAllocationConfirmation;
