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
  
  const pricingData = useAppSelector(selectPricingData);
  const pagination = useAppSelector(selectPagination);
  const loading = useAppSelector(selectPricingLoading);
  const error = useAppSelector(selectPricingError);
  
  /**
   * Fetch pricing records.
   * @param page - The page number to fetch.
   * @param limit - The number of records per page.
   */
  const fetchPricings = (page: number, limit: number) => {
    dispatch(fetchPricingData({ page, limit })).unwrap();
  };
  
  return {
    pricingData,
    pagination,
    loading,
    error,
    fetchPricings,
  };
};

export default usePricing;
