import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchLocationInventorySummaryThunk,
  selectLocationInventorySummaryData,
  selectLocationInventorySummaryError,
  selectLocationInventorySummaryLoading,
  selectLocationInventorySummaryPagination,
} from '@features/locationInventory/state';
import type {
  LocationInventoryQueryParams,
} from '@features/locationInventory/state';

/**
 * Custom hook to access and fetch location inventory summary data.
 *
 */
const useLocationInventorySummary = () => {
  const dispatch = useAppDispatch();

  const data = useAppSelector(selectLocationInventorySummaryData);
  const pagination = useAppSelector(selectLocationInventorySummaryPagination);
  const loading = useAppSelector(selectLocationInventorySummaryLoading);
  const error = useAppSelector(selectLocationInventorySummaryError);

  const fetchLocationInventorySummary = useCallback(
    (params: LocationInventoryQueryParams) => {
      dispatch(fetchLocationInventorySummaryThunk(params));
    },
    [dispatch]
  );

  return {
    data,
    pagination,
    loading,
    error,
    fetchLocationInventorySummary,
  };
};

export default useLocationInventorySummary;
