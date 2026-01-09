import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type {
  FetchPricingTypesParams,
  PricingType,
} from '@features/pricingType/state';
import { Pagination } from '@shared-types/pagination';
import {
  fetchAllPricingTypesThunk,
  selectError,
  selectIsLoading,
  selectPagination,
  selectPricingTypes,
} from '@features/pricingType/state';

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
