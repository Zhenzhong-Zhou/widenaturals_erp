import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPricingDataThunk,
  selectPricingList,
  selectPagination,
  selectPricingLoading,
  selectPricingError,
  selectPriceValueData,
  selectPriceValueLoading,
  selectPriceValueError,
  type PriceRequestParams,
  fetchPriceValueThunk,
} from '@features/pricing';

/**
 * Custom hook for managing pricing data and fetching price values.
 */
const usePricing = () => {
  const dispatch = useAppDispatch();

  // Redux Selectors for Pricing Data
  const pricingData = useAppSelector(selectPricingList);
  const pagination = useAppSelector(selectPagination);
  const loading = useAppSelector(selectPricingLoading);
  const error = useAppSelector(selectPricingError);

  // Redux Selectors for Price Value Data
  const priceValueData = useAppSelector(selectPriceValueData);
  const priceValueLoading = useAppSelector(selectPriceValueLoading);
  const priceValueError = useAppSelector(selectPriceValueError);

  // Local state to prevent unnecessary fetches
  const [isFetched, setIsFetched] = useState(false);

  /**
   * Fetch pricing records.
   * @param page - The page number to fetch.
   * @param limit - The number of records per page.
   */
  const fetchPricings = (page: number, limit: number) => {
    if (page < 1 || loading) return; // Prevent invalid page numbers and duplicate requests

    dispatch(fetchPricingDataThunk({ page, limit })).unwrap();
  };

  /**
   * Fetch price value based on productId and priceTypeId
   * @param {PriceRequestParams} params - The productId and priceTypeId to fetch the price
   */
  const fetchPriceValue = (params: PriceRequestParams) => {
    if (!params.productId || !params.priceTypeId) return; // Ensure valid params
    dispatch(fetchPriceValueThunk(params)).unwrap();
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
    priceValueData,
    priceValueLoading,
    priceValueError,
    fetchPriceValue,
  };
};

export default usePricing;
