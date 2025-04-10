import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectPricingDetails,
  selectProducts,
  selectLocations,
  selectLocationTypes,
  selectPagination,
  selectPricingLoading,
  selectPricingError, getPricingDetailsThunk, fetchPricingDataThunk,
} from '@features/pricing';

/**
 * Custom hook for fetching and managing pricing data.
 * @param {string} [pricingId] - Optional pricing ID to fetch a specific pricing record.
 * @param {number} [page] - The page number (for paginated pricing data).
 * @param {number} [limit] - The number of records per page.
 */
const usePricing = (
  pricingId?: string,
  page: number = 1,
  limit: number = 10
) => {
  const dispatch = useAppDispatch();

  // Selectors
  const pricing = useAppSelector(selectPricingDetails);
  const products = useAppSelector(selectProducts); // Supports multiple products
  const locations = useAppSelector(selectLocations); // Supports multiple locations
  const locationTypes = useAppSelector(selectLocationTypes);
  const pagination = useAppSelector(selectPagination);
  const loading = useAppSelector(selectPricingLoading);
  const error = useAppSelector(selectPricingError);

  useEffect(() => {
    if (pricingId && !pricing) {
      dispatch(getPricingDetailsThunk({ pricingId, page, limit }));
    } else if (!pricingId && !products.length) {
      dispatch(fetchPricingDataThunk({ page, limit }));
    }
  }, [dispatch, pricingId, page, limit, pricing, products.length]);

  /**
   * Fetch pricing records dynamically for pagination.
   * @param newPage - The new page number.
   * @param newLimit - The new page limit.
   */
  const fetchPricings = (newPage: number, newLimit: number) => {
    if (pricingId) {
      dispatch(
        getPricingDetailsThunk({ pricingId, page: newPage, limit: newLimit })
      );
    } else {
      dispatch(fetchPricingDataThunk({ page: newPage, limit: newLimit }));
    }
  };

  return {
    pricing,
    products, // Array of products
    locations, // Array of locations
    locationTypes, // Extracted location types
    pagination,
    loading,
    error,
    fetchPricings,
  };
};

export default usePricing;
