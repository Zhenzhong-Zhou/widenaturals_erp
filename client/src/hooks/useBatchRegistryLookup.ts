import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchBatchRegistryLookupThunk,
  selectBatchRegistryLookupError,
  selectBatchRegistryLookupHasMore,
  selectBatchRegistryLookupItems,
  selectBatchRegistryLookupLoading,
  selectBatchRegistryLookupPagination,
  selectBatchRegistryLookupState,
  type GetBatchRegistryLookupParams,
} from '@features/lookup/state';
import { resetBatchRegistryLookupState } from '@features/lookup/state/batchRegistryLookupSlice.ts';

/**
 * Custom hook to access batch registry lookup state and actions.
 *
 * Provides memoized state values and helper actions for fetching and resetting lookup items.
 */
const useBatchRegistryLookup = () => {
  const dispatch = useAppDispatch();

  const lookupState = useAppSelector(selectBatchRegistryLookupState);
  const items = useAppSelector(selectBatchRegistryLookupItems);
  const loading = useAppSelector(selectBatchRegistryLookupLoading);
  const error = useAppSelector(selectBatchRegistryLookupError);
  const hasMore = useAppSelector(selectBatchRegistryLookupHasMore);
  const pagination = useAppSelector(selectBatchRegistryLookupPagination);

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
    ...lookupState,
    items,
    loading,
    error,
    hasMore,
    pagination,
    fetchLookup,
    resetLookup,
  };
};

export default useBatchRegistryLookup;
