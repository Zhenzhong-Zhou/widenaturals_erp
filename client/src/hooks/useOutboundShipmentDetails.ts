import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchOutboundShipmentDetailsThunk,
  selectOutboundShipmentDetailsData,
  selectOutboundShipmentDetailsError,
  selectOutboundShipmentDetailsLoading,
  selectShipmentFulfillments,
  selectShipmentFulfillmentsItemCount,
  selectShipmentHeader,
} from '@features/outboundFulfillment/state';
import { resetOutboundShipmentDetails } from '@features/outboundFulfillment/state/outboundShipmentDetailsSlice';

/**
 * Custom hook for accessing and managing outbound shipment details state.
 *
 * Provides:
 * - State selectors (data, loading, error, header, fulfillments)
 * - Dispatcher for fetching shipment details
 * - Dispatcher for resetting state
 *
 * @example
 * const {
 *   data,
 *   loading,
 *   error,
 *   header,
 *   fulfillments,
 *   fetchDetails,
 *   reset,
 * } = useOutboundShipmentDetails();
 *
 * useEffect(() => {
 *   fetchDetails(shipmentId);
 *   return () => reset();
 * }, [shipmentId]);
 */
const useOutboundShipmentDetails = () => {
  const dispatch = useAppDispatch();

  // State selectors
  const data = useAppSelector(selectOutboundShipmentDetailsData);
  const loading = useAppSelector(selectOutboundShipmentDetailsLoading);
  const error = useAppSelector(selectOutboundShipmentDetailsError);
  const header = useAppSelector(selectShipmentHeader);
  const fulfillments = useAppSelector(selectShipmentFulfillments);
  const itemCount = useAppSelector(selectShipmentFulfillmentsItemCount);

  // Action dispatchers
  const fetchDetails = useCallback(
    (shipmentId: string) =>
      dispatch(fetchOutboundShipmentDetailsThunk(shipmentId)),
    [dispatch]
  );

  const reset = useCallback(
    () => dispatch(resetOutboundShipmentDetails()),
    [dispatch]
  );

  // Memoize returned object to prevent unnecessary rerenders
  return useMemo(
    () => ({
      data,
      loading,
      error,
      header,
      fulfillments,
      itemCount,
      fetchDetails,
      reset,
    }),
    [data, loading, error, header, fulfillments, fetchDetails, reset]
  );
};

export default useOutboundShipmentDetails;
