import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPricingListDataThunk,
  selectIsPricingListEmpty,
  selectPricingError,
  selectPricingListData,
  selectPricingLoading,
  selectPricingPagination,
  type FetchPricingParams,
} from '@features/pricing/state';

/**
 * Custom hook to manage pricing list data and fetch it with pagination support.
 *
 * @param initialParams - Initial pagination and filter parameters.
 */
const usePricingList = (
  initialParams: FetchPricingParams
) => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectPricingListData);
  const pagination = useAppSelector(selectPricingPagination);
  const isLoading = useAppSelector(selectPricingLoading);
  const error = useAppSelector(selectPricingError);
  const isEmpty = useAppSelector(selectIsPricingListEmpty);
  
  const fetchData = useCallback(
    (params: FetchPricingParams = initialParams) => {
      dispatch(fetchPricingListDataThunk(params));
    },
    [dispatch, initialParams]
  );
  
  return {
    data,
    pagination,
    isLoading,
    error,
    isEmpty,
    fetchData,
  };
};

export default usePricingList;
