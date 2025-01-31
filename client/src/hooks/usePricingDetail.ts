import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  selectPricing,
  selectProduct,
  selectLocation,
  selectLocationType,
  selectPagination,
  selectPricingLoading,
  selectPricingError,
} from '../features/pricing';
import { getPricingDetails, fetchPricingData } from '../features/pricing/state/pricingThunks.ts';

/**
 * Custom hook for fetching and managing pricing data.
 * @param {string} [pricingId] - Optional pricing ID to fetch a specific pricing record.
 * @param {number} [page] - The page number (for paginated pricing data).
 * @param {number} [limit] - The number of records per page.
 */
const usePricing = (pricingId?: string, page: number = 1, limit: number = 10) => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const pricing = useAppSelector(selectPricing);
  const product = useAppSelector(selectProduct);
  const location = useAppSelector(selectLocation);
  const locationType = useAppSelector(selectLocationType);
  const pagination = useAppSelector(selectPagination);
  const loading = useAppSelector(selectPricingLoading);
  const error = useAppSelector(selectPricingError);
  
  useEffect(() => {
    if (pricingId) {
      dispatch(getPricingDetails({ pricingId, page, limit }));
    } else {
      dispatch(fetchPricingData({ page, limit }));
    }
  }, [dispatch, pricingId, page, limit]);
  
  /**
   * Fetch paginated pricing records.
   * @param newPage - The new page number.
   * @param newLimit - The new page limit.
   */
  const fetchPricings = (newPage: number, newLimit: number) => {
    if (pricingId) {
      dispatch(getPricingDetails({ pricingId, page: newPage, limit: newLimit }));
    } else {
      dispatch(fetchPricingData({ page: newPage, limit: newLimit }));
    }
  };
  
  return {
    pricing,
    product,
    location,
    locationType,
    pagination,
    loading,
    error,
    fetchPricings,
  };
};

export default usePricing;
