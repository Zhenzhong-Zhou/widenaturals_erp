import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks';
import { fetchPricingTypeDetailsThunk, PricingTypeDetails, PricingTypePagination } from '../features/pricingTypes';
import {
  selectPricingDetails, selectPricingDetailsError, selectPricingDetailsIsLoading,
  selectPricingDetailsPagination,
} from '../features/pricingTypes';

interface UsePricingDetailsParams {
  initialPage?: number;
  initialLimit?: number;
  pricingTypeId: string; // Required to fetch pricing details
}

interface UsePricingDetailsReturn {
  data: PricingTypeDetails[];
  pagination: PricingTypePagination;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refetch: () => void;
}

const usePricingDetails = ({
                             initialPage = 1,
                             initialLimit = 10,
                             pricingTypeId,
                           }: UsePricingDetailsParams): UsePricingDetailsReturn => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const data = useAppSelector(selectPricingDetails);
  const isLoading = useAppSelector(selectPricingDetailsIsLoading);
  const error = useAppSelector(selectPricingDetailsError);
  
  // Default fallback for pagination if it's null
  const pagination = useAppSelector(selectPricingDetailsPagination) || {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  };
  
  // Local state for pagination
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  
  const fetchData = useCallback(() => {
    if (!pricingTypeId) {
      console.error('Pricing Type ID is required to fetch details.');
      return;
    }
    dispatch(fetchPricingTypeDetailsThunk({ pricingTypeId, page, limit }));
  }, [dispatch, pricingTypeId, page, limit]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const refetch = () => {
    fetchData();
  };
  
  return {
    data,
    pagination,
    isLoading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    refetch,
  };
};

export default usePricingDetails;
