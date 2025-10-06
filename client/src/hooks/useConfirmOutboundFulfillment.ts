import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type ConfirmOutboundFulfillmentRequest, confirmOutboundFulfillmentThunk,
  selectConfirmFulfillmentSummary,
} from '@features/outboundFulfillment/state';
import { resetConfirmationState } from '@features/outboundFulfillment/state/confirmOutboundFulfillmentSlice';

/**
 * Hook: useConfirmOutboundFulfillment
 *
 * Provides access to the outbound fulfillment confirmation flow.
 * Encapsulates dispatch, memoized state, and reset logic for clean UI integration.
 *
 * Features:
 *  - Dispatches the confirmation thunk with given payload
 *  - Tracks loading, success, and error states
 *  - Provides a reset function for cleanup (e.g., on modal close or route change)
 */
const useConfirmOutboundFulfillment = () => {
  const dispatch = useAppDispatch();
  
  // Select memoized state
  const { data, loading, error, lastConfirmedAt, isSuccess } = useAppSelector(
    selectConfirmFulfillmentSummary
  );
  
  // Submit (confirm) handler — memoized to avoid unnecessary re-renders
  const submitConfirmation = useCallback(
    async (request: ConfirmOutboundFulfillmentRequest) => {
      return dispatch(confirmOutboundFulfillmentThunk(request));
    },
    [dispatch]
  );
  
  // Reset state handler
  const resetConfirmation = useCallback(() => {
    dispatch(resetConfirmationState());
  }, [dispatch]);
  
  // Memoized return value for stable reference
  return useMemo(
    () => ({
      data,
      loading,
      error,
      isSuccess,
      lastConfirmedAt,
      submitConfirmation,
      resetConfirmation,
    }),
    [data, loading, error, isSuccess, lastConfirmedAt, submitConfirmation, resetConfirmation]
  );
};

export default useConfirmOutboundFulfillment;
