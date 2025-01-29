import { useState, useEffect, useCallback } from 'react';
import { fetchPricingTypesThunk, PricingType } from '../features/pricingTypes';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  selectError,
  selectIsLoading,
  selectPricingTypes,
  selectTotalPages,
  selectTotalRecords,
} from '../features/pricingTypes/state/pricingTypeSelectors.ts';

interface UsePricingTypesParams {
  initialPage?: number;
  initialLimit?: number;
}

interface UsePricingTypesReturn {
  data: PricingType[];
  totalRecords: number;
  totalPages: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refetch: () => void;
}

const usePricingTypes = ({
                           initialPage = 1,
                           initialLimit = 10,
                         }: UsePricingTypesParams): UsePricingTypesReturn => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const data = useAppSelector(selectPricingTypes);
  const totalRecords = useAppSelector(selectTotalRecords);
  const totalPages = useAppSelector(selectTotalPages);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);
  
  // Local state for pagination
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  
  const fetchData = useCallback(() => {
    dispatch(fetchPricingTypesThunk({ page, rowsPerPage: limit }));
  }, [dispatch, page, limit]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const refetch = () => {
    fetchData();
  };
  
  return {
    data,
    totalRecords,
    totalPages,
    page,
    limit,
    isLoading,
    error,
    setPage,
    setLimit,
    refetch,
  };
};

export default usePricingTypes;
