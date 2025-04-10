import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPricingTypeDetailsThunk,
  PricingRecord,
  PricingTypeDetail,
  PricingTypePagination,
} from '@features/pricingType';
import {
  selectPricingError,
  selectPricingIsLoading,
  selectPricingPagination,
  selectPricingRecords,
  selectPricingTypeDetails,
} from '@features/pricingType';

interface UsePricingDetailsParams {
  initialPage?: number;
  initialLimit?: number;
  pricingTypeId: string; // Required to fetch pricing details
}

interface UsePricingDetailsReturn {
  pricingTypeDetails: PricingTypeDetail | null; // Updated to store single pricing type info
  pricingRecords: PricingRecord[]; // Updated to store the array of pricing records
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
  const pricingTypeDetails = useAppSelector(selectPricingTypeDetails); // Fetches the pricing type info
  const pricingRecords = useAppSelector(selectPricingRecords); // Fetches pricing records
  const isLoading = useAppSelector(selectPricingIsLoading);
  const error = useAppSelector(selectPricingError);
  const pagination = useAppSelector(selectPricingPagination) || {
    page: initialPage,
    limit: initialLimit,
    totalRecords: 0,
    totalPages: 1,
  };

  // Local state for pagination
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  // Fetch Data
  const fetchData = useCallback(() => {
    if (!pricingTypeId) return;
    dispatch(fetchPricingTypeDetailsThunk({ pricingTypeId, page, limit }));
  }, [dispatch, pricingTypeId, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    pricingTypeDetails,
    pricingRecords,
    pagination,
    isLoading,
    error,
    page,
    limit,
    setPage,
    setLimit,
    refetch: fetchData,
  };
};

export default usePricingDetails;
