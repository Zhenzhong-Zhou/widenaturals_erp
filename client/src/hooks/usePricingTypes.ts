import { useState, useEffect, useCallback } from 'react';
import { fetchPricingTypesThunk, PricingType } from '@features/pricingType';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectError,
  selectIsLoading,
  selectPricingTypes,
  selectTotalPages,
  selectTotalRecords,
} from '@features/pricingType/state';

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

  // Fetch pricing types
  const fetchData = useCallback(() => {
    dispatch(fetchPricingTypesThunk({ page, limit }));
  }, [dispatch, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Adjust page number when `limit` changes
  useEffect(() => {
    setPage((prevPage) => {
      const maxPage = Math.ceil(totalRecords / limit) || 1;
      return Math.min(prevPage, maxPage);
    });
  }, [limit, totalRecords]);

  // Method to manually refetch data
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
    setLimit: (newLimit: number) => {
      setLimit(newLimit);
    },
    refetch,
  };
};

export default usePricingTypes;
