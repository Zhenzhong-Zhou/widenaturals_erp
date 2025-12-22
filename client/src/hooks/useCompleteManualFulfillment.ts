import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  completeManualFulfillmentThunk,
  resetConfirmOutboundFulfillment,
  selectCompleteManualFulfillmentCombined,
} from '@features/outboundFulfillment/state';
import type {
  CompleteManualFulfillmentParams,
} from '@features/outboundFulfillment/state';

/**
 * Hook to interact with the completeManualFulfillment state and actions.
 */
const useCompleteManualFulfillment = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector(
    selectCompleteManualFulfillmentCombined
  );

  const submitManualFulfillment = useCallback(
    (params: CompleteManualFulfillmentParams) =>
      dispatch(completeManualFulfillmentThunk(params)),
    [dispatch]
  );

  const resetManualFulfillment = useCallback(
    () => dispatch(resetConfirmOutboundFulfillment()),
    [dispatch]
  );

  return {
    loading,
    data,
    error,
    submitManualFulfillment,
    resetManualFulfillment,
  };
};

export default useCompleteManualFulfillment;
