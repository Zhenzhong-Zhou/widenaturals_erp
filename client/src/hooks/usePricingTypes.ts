import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchAllPricingTypesThunk,
  selectError,
  selectIsLoading,
  selectPagination,
  selectPricingTypes,
  type FetchPricingTypesParams,
} from '@features/pricingType/state';
import type { PricingType } from '@features/pricingType';
import type { Pagination } from '@shared-types/api';

interface UsePricingTypesReturn {
  data: PricingType[];
  pagination: Pagination;
  isLoading: boolean;
  error: string | null;
  refetchAllPricingTypes: (params?: FetchPricingTypesParams) => void;
}

/**
 * Hook to access pricing types and their fetch status from Redux.
 * Pagination and fetch triggers should be managed by the calling component.
 */
const usePricingTypes = (): UsePricingTypesReturn => {
  const dispatch = useAppDispatch();

  const data = useAppSelector(selectPricingTypes);
  const pagination = useAppSelector(selectPagination);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);

  const refetchAllPricingTypes = useCallback(
    (params: FetchPricingTypesParams = {}) => {
      dispatch(fetchAllPricingTypesThunk(params));
    },
    [dispatch]
  );

  return {
    data,
    pagination,
    isLoading,
    error,
    refetchAllPricingTypes,
  };
};

export default usePricingTypes;
