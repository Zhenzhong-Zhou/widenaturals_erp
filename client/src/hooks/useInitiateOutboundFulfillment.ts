import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectInitiateOutboundFulfillmentLoading,
  selectInitiateOutboundFulfillmentError,
  selectInitiateOutboundFulfillmentData,
  selectHasInitiateOutboundFulfillmentData,
} from '@features/outboundFulfillment/state/initiateOutboundFulfillmentSelectors';
import { initiateOutboundFulfillmentThunk } from '@features/outboundFulfillment/state/outboundFulfillmentThunks';
import { resetInitiateOutboundFulfillmentState } from '@features/outboundFulfillment/state/initiateOutboundFulfillmentSlice';
import type { InitiateFulfillmentRequest } from '@features/outboundFulfillment/state/outboundFulfillmentTypes';

/**
 * Custom hook to manage outbound fulfillment initiation.
 *
 * Provides access to state (loading, error, data) and exposes
 * actions for submitting a new fulfillment request and resetting state.
 */
const useInitiateOutboundFulfillment = () => {
  const dispatch = useAppDispatch();
  
  // Select slice state
  const loading = useAppSelector(selectInitiateOutboundFulfillmentLoading);
  const error = useAppSelector(selectInitiateOutboundFulfillmentError);
  const data = useAppSelector(selectInitiateOutboundFulfillmentData);
  const hasData = useAppSelector(selectHasInitiateOutboundFulfillmentData);
  
  /**
   * Submit function to initiate outbound fulfillment.
   */
  const submit = useCallback(
    async (request: InitiateFulfillmentRequest) => {
      return dispatch(initiateOutboundFulfillmentThunk(request)).unwrap();
    },
    [dispatch]
  );
  
  /**
   * Reset function to clear slice state.
   */
  const reset = useCallback(() => {
    dispatch(resetInitiateOutboundFulfillmentState());
  }, [dispatch]);
  
  return {
    loading,
    error,
    data,
    hasData,
    submit,
    reset,
  };
};

export default useInitiateOutboundFulfillment;
