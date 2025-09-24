import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPaginatedOutboundFulfillmentThunk,
  type OutboundFulfillmentQuery,
  selectHasPaginatedOutboundFulfillments,
  selectPaginatedOutboundFulfillmentsData,
  selectPaginatedOutboundFulfillmentsError,
  selectPaginatedOutboundFulfillmentsLoading, selectPaginatedOutboundFulfillmentsPagination,
  selectPaginatedOutboundFulfillmentsTotalRecords,
} from '@features/outboundFulfillment/state';
import {
  resetPaginatedOutboundFulfillments
} from '@features/outboundFulfillment/state/paginatedOutboundFulfillmentsSlice';

/**
 * Hook for accessing and managing paginated outbound fulfillment state.
 *
 * Provides:
 * - Slice state (loading, error, data, pagination)
 * - Derived selectors (hasData, totalRecords)
 * - Dispatcher functions for fetching and resetting state
 */
const usePaginatedOutboundFulfillments = () => {
  const dispatch = useAppDispatch();
  
  // --- Selectors ---
  const loading = useAppSelector(selectPaginatedOutboundFulfillmentsLoading);
  const error = useAppSelector(selectPaginatedOutboundFulfillmentsError);
  const data = useAppSelector(selectPaginatedOutboundFulfillmentsData);
  const pagination = useAppSelector(selectPaginatedOutboundFulfillmentsPagination);
  const hasData = useAppSelector(selectHasPaginatedOutboundFulfillments);
  const totalRecords = useAppSelector(selectPaginatedOutboundFulfillmentsTotalRecords);
  
  // --- Actions ---
  const fetch = useCallback(
    (query: OutboundFulfillmentQuery) => {
      return dispatch(fetchPaginatedOutboundFulfillmentThunk(query));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetPaginatedOutboundFulfillments());
  }, [dispatch]);
  
  return {
    // state
    loading,
    error,
    data,
    pagination,
    hasData,
    totalRecords,
    
    // actions
    fetch,
    reset,
  };
};

export default usePaginatedOutboundFulfillments;
