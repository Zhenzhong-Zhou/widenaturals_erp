import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectBatchRegistryDropdownState,
  selectBatchRegistryDropdownItems,
  selectBatchRegistryDropdownLoading,
  selectBatchRegistryDropdownError,
  selectBatchRegistryDropdownHasMore,
  selectBatchRegistryDropdownPagination,
} from '@features/dropdown/state/batchRegistryDropdownSelectors';
import { resetBatchRegistryDropdownState } from '@features/dropdown/state/batchRegistryDropdownSlice';
import { fetchBatchRegistryDropdownThunk, type GetBatchRegistryDropdownParams } from '@features/dropdown/state';

/**
 * Custom hook to access batch registry dropdown state and actions.
 *
 * Provides memoized state values and helper actions for fetching and resetting dropdown items.
 */
const useBatchRegistryDropdown = () => {
  const dispatch = useAppDispatch();
  
  const dropdownState = useAppSelector(selectBatchRegistryDropdownState);
  const items = useAppSelector(selectBatchRegistryDropdownItems);
  const loading = useAppSelector(selectBatchRegistryDropdownLoading);
  const error = useAppSelector(selectBatchRegistryDropdownError);
  const hasMore = useAppSelector(selectBatchRegistryDropdownHasMore);
  const pagination = useAppSelector(selectBatchRegistryDropdownPagination);
  
  const fetchDropdown = useCallback(
    (params: GetBatchRegistryDropdownParams = {}) =>
      dispatch(fetchBatchRegistryDropdownThunk(params)),
    [dispatch]
  );
  
  const resetDropdown = useCallback(() => dispatch(resetBatchRegistryDropdownState()), [dispatch]);

  return {
    ...dropdownState,
    items,
    loading,
    error,
    hasMore,
    pagination,
    fetchDropdown,
    resetDropdown,
  };
};

export default useBatchRegistryDropdown;
