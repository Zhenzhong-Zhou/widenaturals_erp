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
  
  // Ensure page does not exceed total pages on limit change
  const adjustPageOnLimitChange = (newLimit: number) => {
    const newPage = Math.min(Math.ceil(totalRecords / newLimit), page);
    setPage(newPage || 1); // Reset to the first page if necessary
  };
  
  const fetchData = useCallback(() => {
    dispatch(fetchPricingTypesThunk({ page, rowsPerPage: limit }));
  }, [dispatch, page, limit]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    adjustPageOnLimitChange(limit);
  }, [limit, totalRecords]); // Trigger when the limit or total records change
  
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
    setLimit: (newLimit) => {
      adjustPageOnLimitChange(newLimit);
      setLimit(newLimit);
    },
    refetch,
  };
};

export default usePricingTypes;
