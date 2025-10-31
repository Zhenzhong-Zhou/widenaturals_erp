import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type CompleteManualFulfillmentParams,
  completeManualFulfillmentThunk,
  selectCompleteManualFulfillmentCombined,
} from '@features/outboundFulfillment/state';
import { resetCompleteManualFulfillment } from '@features/outboundFulfillment/state/completeManualFulfillmentSlice';

/**
 * Hook to interact with the completeManualFulfillment state and actions.
 */
const useCompleteManualFulfillment = () => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector(selectCompleteManualFulfillmentCombined);
  
  const submitManualFulfillment = useCallback(
    (params: CompleteManualFulfillmentParams) =>
      dispatch(completeManualFulfillmentThunk(params)),
    [dispatch]
  );
  
  const resetManualFulfillment = useCallback(
    () => dispatch(resetCompleteManualFulfillment()),
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
