import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  selectPagination,
  selectPricingData,
  selectPricingLoading,
  selectPricingError,
} from '../features/pricing/state/pricingSelectors.ts';
import { fetchPricingData } from '../features/pricing/state/pricingThunks.ts';

/**
 * Custom hook for managing pricing data.
 */
const usePricing = () => {
  const dispatch = useAppDispatch();

  // Redux Selectors
  const pricingData = useAppSelector(selectPricingData);
  const pagination = useAppSelector(selectPagination);
  const loading = useAppSelector(selectPricingLoading);
  const error = useAppSelector(selectPricingError);

  // Local state to prevent unnecessary fetches
  const [isFetched, setIsFetched] = useState(false);

  /**
   * Fetch pricing records.
   * @param page - The page number to fetch.
   * @param limit - The number of records per page.
   */
  const fetchPricings = (page: number, limit: number) => {
    if (page < 1 || loading) return; // Prevent invalid page numbers and duplicate requests

    dispatch(fetchPricingData({ page, limit })).unwrap();
  };

  // Fetch data on initial render
  useEffect(() => {
    if (!isFetched) {
      fetchPricings(1, pagination.limit);
      setIsFetched(true); // Prevent infinite re-fetching
    }
  }, [pagination.limit]); // Depend on limit to allow updates when it changes

  return {
    pricingData,
    pagination,
    loading,
    error,
    fetchPricings,
  };
};

export default usePricing;
