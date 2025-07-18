import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchBatchRegistryLookupThunk,
  selectBatchRegistryLookupError,
  selectBatchRegistryLookupItems,
  selectBatchRegistryLookupLoading,
  selectBatchRegistryLookupMeta,
  type GetBatchRegistryLookupParams,
} from '@features/lookup/state';
import { resetBatchRegistryLookupState } from '@features/lookup/state/batchRegistryLookupSlice';

/**
 * Custom hook to access batch registry lookup state and actions.
 *
 * Provides memoized lookup state values and helper actions for fetching and resetting.
 *
 * @returns Object containing lookup data, loading state, error, pagination metadata, and actions
 */
const useBatchRegistryLookup = () => {
  const dispatch = useAppDispatch();

  const items = useAppSelector(selectBatchRegistryLookupItems);
  const loading = useAppSelector(selectBatchRegistryLookupLoading);
  const error = useAppSelector(selectBatchRegistryLookupError);
  const meta = useAppSelector(selectBatchRegistryLookupMeta);

  const fetchLookup = useCallback(
    (params: GetBatchRegistryLookupParams = {}) =>
      dispatch(fetchBatchRegistryLookupThunk(params)),
    [dispatch]
  );

  const resetLookup = useCallback(
    () => dispatch(resetBatchRegistryLookupState()),
    [dispatch]
  );

  return {
    items,
    loading,
    error,
    meta,
    fetchLookup,
    resetLookup,
  };
};

export default useBatchRegistryLookup;
